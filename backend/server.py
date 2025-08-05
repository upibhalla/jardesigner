import os
import json
import subprocess
import uuid
import time
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, join_room

# --- Configuration ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMP_CONFIG_DIR = os.path.join(BASE_DIR, 'temp_configs')
PLOT_OUTPUT_DIR = os.path.join(BASE_DIR, 'simulation_plots')
MOOSE_SCRIPT_NAME = "jardesigner.py"
MOOSE_SCRIPT_PATH = os.path.join(BASE_DIR, MOOSE_SCRIPT_NAME)

# Ensure necessary directories exist
os.makedirs(TEMP_CONFIG_DIR, exist_ok=True)
os.makedirs(PLOT_OUTPUT_DIR, exist_ok=True)

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- Store running process and plot info ---
running_processes = {}
# ADDED: Dictionary to map a client's unique ID to their simulation PID
client_sim_map = {}


def stream_printer(stream, pid, stream_name):
    """
    Reads a stream line-by-line and prints it to the console in real-time.
    This function is designed to be run in a separate thread.
    """
    try:
        for line in iter(stream.readline, ''):
            if line:
                print(f"[{pid}-{stream_name}] {line.strip()}")
        stream.close()
        print(f"Stream printer for PID {pid} ({stream_name}) has finished.")
    except Exception as e:
        print(f"Error in stream printer for PID {pid} ({stream_name}): {e}")


# --- API Endpoints ---

@app.route('/')
def index():
    return jsonify({"message": "Flask backend is running!"})


@socketio.on('sim_command')
def handle_sim_command(data):
    pid_str = data.get('pid')
    command = data.get('command')

    if not pid_str or not command:
        print("Error: sim_command missing pid or command")
        return
    
    try:
        pid = int(pid_str)
    except (ValueError, TypeError):
        print(f"Error: sim_command received invalid PID format: {pid_str}")
        return

    if pid in running_processes:
        process = running_processes[pid]["process"]
        if process.poll() is None:
            try:
                command_payload = {
                    "command": command,
                    "params": data.get("params", {})
                }
                command_string = json.dumps(command_payload) + '\n'

                process.stdin.write(command_string)
                process.stdin.flush()
                print(f"Sent command '{command}' to PID {pid}")
            except Exception as e:
                print(f"Error writing to PID {pid} stdin: {e}")
        else:
            print(f"Error: Process {pid} is no longer running.")
    else:
        print(f"Error: Could not find process with PID {pid}")


@app.route('/launch_simulation', methods=['POST'])
def launch_simulation():
    print("Received request for /api/launch_simulation")
    try:
        # MODIFIED: Read the new payload structure
        request_data = request.json
        config_data = request_data.get('config_data')
        client_id = request_data.get('client_id')

        if not config_data or not isinstance(config_data, dict):
            return jsonify({"status": "error", "message": "Invalid or missing JSON config data"}), 400
        
        if not client_id:
            return jsonify({"status": "error", "message": "Request is missing client_id"}), 400

        # MODIFIED: Check if the client already has a running simulation
        if client_id in client_sim_map:
            pid = client_sim_map[client_id]
            if pid in running_processes and running_processes[pid]['process'].poll() is None:
                print(f"Client {client_id} with active PID {pid} tried to launch a new model. Request rejected.")
                return jsonify({
                    "status": "error",
                    "message": f"You already have a running simulation (PID: {pid}). Please reset it before building a new one."
                }), 409 # 409 Conflict is an appropriate status code

        print(f"Received config data for client {client_id}: {json.dumps(config_data, indent=2)}")

        temp_file_path = None
        try:
            temp_file_name = f"config_{str(uuid.uuid4())}.json"
            temp_file_path = os.path.join(TEMP_CONFIG_DIR, temp_file_name)
            with open(temp_file_path, 'w', encoding='utf-8') as temp_file:
                json.dump(config_data, temp_file, indent=2)
            print(f"Configuration saved temporarily to: {temp_file_path}")
        except Exception as e:
            print(f"Error saving temporary config file: {e}")
            return jsonify({"status": "error", "message": f"Could not save config file: {e}"}), 500

        if not os.path.exists(MOOSE_SCRIPT_PATH):
            print(f"Error: MOOSE script not found at {MOOSE_SCRIPT_PATH}")
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as e_clean:
                    print(f"Error cleaning up temp file {temp_file_path}: {e_clean}")
            return jsonify({"status": "error", "message": f"MOOSE script '{MOOSE_SCRIPT_NAME}' not found."}), 500

        svg_filename = f"plot_{str(uuid.uuid4())}.svg"
        svg_filepath = os.path.abspath(os.path.join(PLOT_OUTPUT_DIR, svg_filename))
        data_channel_id = str(uuid.uuid4())
        
        command = [
            "python", "-u",
            MOOSE_SCRIPT_PATH,
            temp_file_path,
            "--plotFile", svg_filepath,
            "--data-channel-id", data_channel_id
        ]
        print(f"Executing command: {' '.join(command)}")

        try:
            process = subprocess.Popen(
                command,
                cwd=BASE_DIR,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            print(f"Started MOOSE process with PID: {process.pid}")

            running_processes[process.pid] = {
                "process": process,
                "svg_filename": svg_filename,
                "temp_config_file_path": temp_file_path,
                "start_time": time.time(),
                "data_channel_id": data_channel_id,
            }

            # MODIFIED: Map the client_id to the new process pid
            client_sim_map[client_id] = process.pid

            stdout_thread = threading.Thread(
                target=stream_printer,
                args=(process.stdout, process.pid, 'stdout'),
                daemon=True
            )
            stdout_thread.start()

            stderr_thread = threading.Thread(
                target=stream_printer,
                args=(process.stderr, process.pid, 'stderr'),
                daemon=True
            )
            stderr_thread.start()

        except Exception as e:
            print(f"Error launching MOOSE script: {e}")
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as e_clean:
                    print(f"Error cleaning up temp file {temp_file_path}: {e_clean}")
            return jsonify({"status": "error", "message": f"Failed to launch MOOSE script: {e}"}), 500

        return jsonify({
            "status": "success",
            "message": f"MOOSE simulation started (PID: {process.pid}).",
            "pid": process.pid,
            "svg_filename": svg_filename,
            "data_channel_id": data_channel_id
        }), 200

    except Exception as e:
        print(f"Error processing /launch_simulation request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"An unexpected error occurred: {e}"}), 500


@app.route('/internal/push_data', methods=['POST'])
def push_data():
    data = request.json
    channel_id = data.get('data_channel_id')
    payload = data.get('payload')

    if not channel_id or payload is None:
        return jsonify({"status": "error", "message": "Missing data_channel_id or payload"}), 400

    socketio.emit('simulation_data', payload, room=channel_id)
    
    return jsonify({"status": "success"}), 200


@socketio.on('connect')
def handle_connect():
    print("-------------------------------------------")
    print(f"SERVER LOG: Client attempting to connect with sid: {request.sid}")

    headers = dict(request.headers)
    upgrade = headers.get("Upgrade", "Not found").lower()
    connection = headers.get("Connection", "Not found").lower()

    print(f"SERVER LOG: Request Headers => {headers}")
    print(f"SERVER LOG: 'Upgrade' header value => '{upgrade}'")
    print(f"SERVER LOG: 'Connection' header value => '{connection}'")

    if "websocket" not in upgrade:
        print("SERVER LOG: >>> FATAL: 'Upgrade: websocket' header is MISSING. Check Nginx config.")
    else:
        print("SERVER LOG: >>> SUCCESS: 'Upgrade: websocket' header found.")
    print("-------------------------------------------")
    print(f"Client connected: {request.sid}")


@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")


@socketio.on('join_sim_channel')
def handle_join_sim_channel(data):
    channel_id = data.get('data_channel_id')
    if not channel_id:
        print(f"Client {request.sid} tried to join a channel without providing a channel_id.")
        return

    join_room(channel_id)
    print(f"Client {request.sid} joined data channel (room): {channel_id}")


@app.route('/simulation_status/<int:pid>', methods=['GET'])
def simulation_status(pid):
    print(f"Checking status for PID: {pid}")
    if pid not in running_processes:
        return jsonify({"status": "error", "message": "Process ID not found."}), 404

    proc_info = running_processes[pid]
    process = proc_info["process"]
    svg_filename = proc_info["svg_filename"]
    svg_filepath = os.path.abspath(os.path.join(PLOT_OUTPUT_DIR, svg_filename))

    poll_result = process.poll()
    if poll_result is None:
        return jsonify({"status": "running", "pid": pid, "message": "Simulation is still in progress."}), 200
    else:
        print(f"Process {pid} has terminated with return code {poll_result}.")
        
        plot_exists = os.path.exists(svg_filepath)
        if plot_exists:
            return jsonify({"status": "completed", "pid": pid, "svg_filename": svg_filename, "plot_ready": True}), 200
        else:
            return jsonify({"status": "completed_error", "pid": pid, "message": "Plot not found. Check console logs for errors.", "plot_ready": False}), 200


@app.route('/plots/<filename>')
def get_plot(filename):
    print(f"Request for plot: {filename}")
    if '..' in filename or filename.startswith('/'):
        return jsonify({"status": "error", "message": "Invalid filename."}), 400
    return send_from_directory(PLOT_OUTPUT_DIR, filename)


@app.route('/reset_simulation', methods=['POST'])
def reset_simulation():
    # MODIFIED: Read client_id from the request
    request_data = request.json
    pid_to_reset_str = request_data.get('pid')
    client_id = request_data.get('client_id')

    print(f"Received request to RESET simulation with PID: {pid_to_reset_str} from Client: {client_id}")
    
    if not pid_to_reset_str:
        return jsonify({"status": "error", "message": "PID not provided for reset."}), 400

    try:
        pid_to_reset = int(pid_to_reset_str)
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": f"Invalid PID format: {pid_to_reset_str}"}), 400

    if pid_to_reset in running_processes:
        try:
            proc_info = running_processes[pid_to_reset]
            if proc_info["process"].poll() is None:
                print(f"Terminating process {pid_to_reset}...")
                proc_info["process"].terminate()
                proc_info["process"].wait(timeout=5)
                print(f"Process {pid_to_reset} terminated.")
            del running_processes[pid_to_reset]

            # MODIFIED: Remove the client's entry from the tracking map
            if client_id and client_id in client_sim_map:
                client_sim_map.pop(client_id, None)
                print(f"Cleared simulation mapping for client {client_id}.")

            return jsonify({"status": "success", "message": f"Simulation PID {pid_to_reset} reset."}), 200
        except Exception as e:
            print(f"Error during reset of PID {pid_to_reset}: {e}")
            if pid_to_reset in running_processes:
                del running_processes[pid_to_reset]
            return jsonify({"status": "error", "message": f"Error resetting simulation: {e}"}), 500
    else:
        return jsonify({"status": "error", "message": "Process ID not found for reset."}), 404


if __name__ == '__main__':
    print(f"MOOSE Script Path: {MOOSE_SCRIPT_PATH}")
    print(f"Plot Output Directory (absolute): {os.path.abspath(PLOT_OUTPUT_DIR)}")
    print(f"Temporary Config Directory (absolute): {os.path.abspath(TEMP_CONFIG_DIR)}")
    print("Starting Flask-SocketIO server...")
    socketio.run(app, host='0.0.0.0', debug=False, port=5000)
