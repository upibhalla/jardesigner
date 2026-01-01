import os
import json
import subprocess
import uuid
import time
import threading
import shutil
import re
from flask import Flask, request, jsonify, send_from_directory, send_file, after_this_request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room
from werkzeug.utils import secure_filename

# --- Configuration ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Removed TEMP_CONFIG_DIR
USER_UPLOADS_DIR = os.path.join(BASE_DIR, 'user_uploads')
MOOSE_SCRIPT_NAME = "jardesigner.py"
MOOSE_SCRIPT_PATH = os.path.join(BASE_DIR, MOOSE_SCRIPT_NAME)

os.makedirs(USER_UPLOADS_DIR, exist_ok=True)

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- Store running process and session info ---
running_processes = {}
client_sim_map = {}
sid_clientid_map = {}


def stream_printer(stream, pid, stream_name):
    """
    Reads a stream line-by-line and prints it to the console in real-time.
    """
    try:
        for line in iter(stream.readline, ''):
            if line:
                print(f"[{pid}-{stream_name}] {line.strip()}")
        stream.close()
        print(f"Stream printer for PID {pid} ({stream_name}) has finished.")
    except Exception as e:
        print(f"Error in stream printer for PID {pid} ({stream_name}): {e}")


def terminate_process(pid):
    """Safely terminates a running process and cleans up its entry."""
    if pid in running_processes:
        try:
            proc_info = running_processes[pid]
            if proc_info["process"].poll() is None:
                print(f"Terminating process {pid}...")
                proc_info["process"].terminate()
                proc_info["process"].wait(timeout=5)
                print(f"Process {pid} terminated.")
            del running_processes[pid]
            return True
        except Exception as e:
            print(f"Error during termination of PID {pid}: {e}")
            if pid in running_processes:
                del running_processes[pid]
    return False

def get_next_model_filename(directory):
    """
    Scans the directory for files matching 'jardes_model_<n>.json'
    and returns the filename for the next increment.
    """
    pattern = re.compile(r'^jardes_model_(\d+)\.json$')
    max_n = 0
    
    if os.path.exists(directory):
        for filename in os.listdir(directory):
            match = pattern.match(filename)
            if match:
                try:
                    n = int(match.group(1))
                    if n > max_n:
                        max_n = n
                except ValueError:
                    continue
    
    return f"jardes_model_{max_n + 1}.json"

# --- API Endpoints ---
@app.route('/')
def index():
    return jsonify({"message": "Flask backend is running!"})

@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part in the request"}), 400
    
    file = request.files['file']
    client_id = request.form.get('clientId')

    if not client_id:
        return jsonify({"status": "error", "message": "No clientId provided"}), 400
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        session_dir = os.path.join(USER_UPLOADS_DIR, client_id)
        os.makedirs(session_dir, exist_ok=True)
        
        save_path = os.path.join(session_dir, filename)
        file.save(save_path)
        print(f"Saved file for client {client_id} to {save_path}")
        
        return jsonify({"status": "success", "message": "File uploaded successfully"}), 200

    return jsonify({"status": "error", "message": "File upload failed for unknown reasons"}), 500

@socketio.on('sim_command')
def handle_sim_command(data):
    pid_str = data.get('pid')
    command = data.get('command')
    if not pid_str or not command: return
    try:
        pid = int(pid_str)
    except (ValueError, TypeError): return
    if pid in running_processes:
        process = running_processes[pid]["process"]
        if process.poll() is None:
            try:
                command_payload = {"command": command, "params": data.get("params", {})}
                command_string = json.dumps(command_payload) + '\n'
                process.stdin.write(command_string)
                process.stdin.flush()
            except Exception as e:
                print(f"Error writing to PID {pid} stdin: {e}")

@app.route('/launch_simulation', methods=['POST'])
def launch_simulation():
    request_data = request.json
    config_data = request_data.get('config_data')
    client_id = request_data.get('client_id')

    if not config_data or not isinstance(config_data, dict):
        return jsonify({"status": "error", "message": "Invalid or missing JSON config data"}), 400
    if not client_id:
        return jsonify({"status": "error", "message": "Request is missing client_id"}), 400
    
    # Terminate existing process for this client if any
    if client_id in client_sim_map:
        old_pid = client_sim_map[client_id]
        print(f"Client {client_id} has an existing simulation (PID: {old_pid}). Terminating it.")
        terminate_process(old_pid)
        client_sim_map.pop(client_id, None)

    # Prepare User Directory
    session_dir = os.path.join(USER_UPLOADS_DIR, client_id)
    os.makedirs(session_dir, exist_ok=True)

    # Determine next filename: jardes_model_<n>.json
    model_filename = get_next_model_filename(session_dir)
    config_file_path = os.path.join(session_dir, model_filename)

    # Save the model config
    try:
        with open(config_file_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2)
    except Exception as e:
        return jsonify({"status": "error", "message": f"Could not save config file: {e}"}), 500
    
    # Plot Output File
    plot_filename = "plot.json"
    plot_filepath = os.path.abspath(os.path.join(session_dir, plot_filename))
    data_channel_id = str(uuid.uuid4())
    
    command = [
        "python", "-u", "-m",
        "jardesigner.jardesigner",
        config_file_path,  # Use the new persistent path
        "--plotFile", plot_filepath, 
        "--data-channel-id", data_channel_id,
        "--session-path", session_dir
    ]
    
    try:
        env = os.environ.copy() 
        if 'PYTHONPATH' in env:
            env['PYTHONPATH'] = f"{BASE_DIR}:{env['PYTHONPATH']}"
        else:
            env['PYTHONPATH'] = BASE_DIR
        process = subprocess.Popen(
            command, cwd=BASE_DIR, stdin=subprocess.PIPE, 
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, text=True, bufsize=1, env = env
        )

        running_processes[process.pid] = {
            "process": process, "plot_filename": plot_filename,
            "config_file_path": config_file_path, "start_time": time.time(),
            "data_channel_id": data_channel_id, "client_id": client_id,
        }
        client_sim_map[client_id] = process.pid

        threading.Thread(target=stream_printer, args=(process.stdout, process.pid, 'stdout'), daemon=True).start()
        threading.Thread(target=stream_printer, args=(process.stderr, process.pid, 'stderr'), daemon=True).start()

    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to launch MOOSE script: {e}"}), 500

    return jsonify({
        "status": "success", "pid": process.pid,
        "plot_filename": plot_filename, "data_channel_id": data_channel_id
    }), 200

@app.route('/download_project/<client_id>', methods=['GET'])
def download_project(client_id):
    # Security check for path traversal
    if '..' in client_id or '/' in client_id or '\\' in client_id:
        return jsonify({"status": "error", "message": "Invalid Client ID"}), 400

    session_dir = os.path.join(USER_UPLOADS_DIR, client_id)
    if not os.path.exists(session_dir):
        return jsonify({"status": "error", "message": "Project directory not found"}), 404
    
    # Create a unique temp filename for the zip in the root UPLOADS dir (not temp_configs)
    timestamp = str(uuid.uuid4())
    zip_base_name = os.path.join(USER_UPLOADS_DIR, f"project_{timestamp}")
    
    try:
        # make_archive adds the .zip extension automatically
        archive_path = shutil.make_archive(zip_base_name, 'zip', session_dir)
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to zip project: {str(e)}"}), 500

    # Schedule file deletion after the request is finished
    @after_this_request
    def remove_file(response):
        try:
            if os.path.exists(archive_path):
                os.remove(archive_path)
                print(f"Deleted temp zip: {archive_path}")
        except Exception as e:
            print(f"Error removing temp zip: {e}")
        return response

    return send_file(archive_path, as_attachment=True, download_name="project.zip")

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
    headers = dict(request.headers)
    upgrade = headers.get("Upgrade", "Not found").lower()
    if "websocket" not in upgrade:
        print("SERVER LOG: >>> FATAL: 'Upgrade: websocket' header is MISSING.")
    else:
        print("SERVER LOG: >>> SUCCESS: 'Upgrade: websocket' header found.")


@socketio.on('register_client')
def handle_register_client(data):
    client_id = data.get('clientId')
    if client_id:
        sid_clientid_map[request.sid] = client_id
        print(f"Registered client {client_id} to SID {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")
    client_id = sid_clientid_map.get(request.sid)
    if client_id:
        print(f"Client {client_id} disconnected. Cleaning up session data.")
        session_dir = os.path.join(USER_UPLOADS_DIR, client_id)
        if os.path.exists(session_dir):
            try:
                shutil.rmtree(session_dir)
                print(f"Successfully deleted session directory: {session_dir}")
            except Exception as e:
                print(f"Error deleting session directory {session_dir}: {e}")
        
        sid_clientid_map.pop(request.sid, None)
        pid = client_sim_map.pop(client_id, None)
        if pid:
            terminate_process(pid)

@socketio.on('join_sim_channel')
def handle_join_sim_channel(data):
    channel_id = data.get('data_channel_id')
    if not channel_id: return
    join_room(channel_id)

@app.route('/simulation_status/<int:pid>', methods=['GET'])
def simulation_status(pid):
    if pid not in running_processes:
        return jsonify({"status": "error", "message": "Process ID not found."}), 404
    
    proc_info = running_processes[pid]
    process = proc_info["process"]
    plot_filename = proc_info["plot_filename"]
    client_id = proc_info["client_id"]
    session_dir = os.path.join(USER_UPLOADS_DIR, client_id)
    plot_filepath = os.path.abspath(os.path.join(session_dir, plot_filename))

    poll_result = process.poll()
    if poll_result is None:
        return jsonify({"status": "running", "pid": pid, "message": "Simulation is still in progress."}), 200
    else:
        plot_exists = os.path.exists(plot_filepath)
        if plot_exists:
            return jsonify({"status": "completed", "pid": pid, "plot_filename": plot_filename, "plot_ready": True}), 200
        else:
            return jsonify({"status": "completed_error", "pid": pid, "message": "Plot not found."}), 200

@app.route('/session_file/<client_id>/<filename>')
def get_session_file(client_id, filename):
    if '..' in client_id or '/' in client_id or '..' in filename or filename.startswith('/'):
        return jsonify({"status": "error", "message": "Invalid path."}), 400
    session_dir = os.path.join(USER_UPLOADS_DIR, client_id)
    return send_from_directory(session_dir, filename)

@app.route('/reset_simulation', methods=['POST'])
def reset_simulation():
    request_data = request.json
    pid_to_reset_str = request_data.get('pid')
    client_id = request_data.get('client_id')
    if not pid_to_reset_str:
        return jsonify({"status": "error", "message": "PID not provided for reset."}), 400
    try:
        pid_to_reset = int(pid_to_reset_str)
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": f"Invalid PID format: {pid_to_reset_str}"}), 400

    if terminate_process(pid_to_reset):
        if client_id and client_id in client_sim_map:
            client_sim_map.pop(client_id, None)
        return jsonify({"status": "success", "message": f"Simulation PID {pid_to_reset} reset."}), 200
    else:
        return jsonify({"status": "error", "message": "Process ID not found for reset."}), 404

if __name__ == '__main__':
    print(f"MOOSE Script Path: {MOOSE_SCRIPT_PATH}")
    print(f"User Uploads Directory (absolute): {os.path.abspath(USER_UPLOADS_DIR)}")
    print("Starting Flask-SocketIO server...")
    socketio.run(app, host='0.0.0.0', debug=False, port=5000)

