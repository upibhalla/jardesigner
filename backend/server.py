import os
import json
import tempfile
import subprocess
import uuid # For generating unique filenames
import time # For simulation status check (optional, for demo)
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

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

# --- Store running process and plot info ---
running_processes = {} # Stores {pid: {process: Popen_object, svg_filename: str, temp_config_file: str, stdout: str, stderr: str}}

# --- API Endpoints ---

@app.route('/')
def index():
    return jsonify({"message": "Flask backend is running!"})

@app.route('/launch_simulation', methods=['POST'])
def launch_simulation():
    print("Received request for /launch_simulation")
    try:
        config_data = request.json
        if not config_data or not isinstance(config_data, dict):
            print("Error: Invalid or missing JSON data.")
            return jsonify({"status": "error", "message": "Invalid or missing JSON data"}), 400

        print(f"Received config data: {json.dumps(config_data, indent=2)}")

        temp_file_path = None
        try:
            # Create a unique name for the temp file so it can be identified later if needed
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
            # Clean up the temp file if script not found, as it's unusable
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    print(f"Cleaned up unusable temp config file: {temp_file_path}")
                except Exception as e_clean:
                    print(f"Error cleaning up temp file {temp_file_path}: {e_clean}")
            return jsonify({"status": "error", "message": f"MOOSE script '{MOOSE_SCRIPT_NAME}' not found."}), 500

        unique_svg_id = str(uuid.uuid4())
        svg_filename = f"plot_{unique_svg_id}.svg"
        svg_filepath = os.path.abspath(os.path.join(PLOT_OUTPUT_DIR, svg_filename))
        print(f"Generated SVG filepath (absolute): {svg_filepath}")

        command = ["python", MOOSE_SCRIPT_PATH, temp_file_path, "--plotFile", svg_filepath]
        print(f"Executing command: {' '.join(command)}")

        try:
            process = subprocess.Popen(
                command,
                cwd=BASE_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            print(f"Started MOOSE process with PID: {process.pid}")

            running_processes[process.pid] = {
                "process": process,
                "svg_filename": svg_filename,
                "temp_config_file_path": temp_file_path, # Store the full path
                "start_time": time.time(),
                "stdout": None,
                "stderr": None
            }

        except Exception as e:
            print(f"Error launching MOOSE script: {e}")
            # Clean up temp file if launch fails
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    print(f"Cleaned up temp config file after launch failure: {temp_file_path}")
                except Exception as e_clean:
                    print(f"Error cleaning up temp file {temp_file_path}: {e_clean}")
            return jsonify({"status": "error", "message": f"Failed to launch MOOSE script: {e}"}), 500

        return jsonify({
            "status": "success",
            "message": f"MOOSE simulation started (PID: {process.pid}). Plot will be '{svg_filename}'. Config: '{os.path.basename(temp_file_path)}'",
            "pid": process.pid,
            "svg_filename": svg_filename,
            "temp_config_filename": os.path.basename(temp_file_path) # Send filename for reference
        }), 200

    except Exception as e:
        print(f"Error processing /launch_simulation request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"An unexpected error occurred: {e}"}), 500

@app.route('/simulation_status/<int:pid>', methods=['GET'])
def simulation_status(pid):
    print(f"Checking status for PID: {pid}")
    if pid not in running_processes:
        return jsonify({"status": "error", "message": "Process ID not found."}), 404

    proc_info = running_processes[pid]
    process = proc_info["process"]
    svg_filename = proc_info["svg_filename"]
    svg_filepath = os.path.abspath(os.path.join(PLOT_OUTPUT_DIR, svg_filename))
    # temp_config_file_path = proc_info.get("temp_config_file_path") # Path to the temp config file

    poll_result = process.poll()

    if poll_result is None:
        return jsonify({
            "status": "running",
            "pid": pid,
            "message": "Simulation is still in progress."
        }), 200
    else:
        if proc_info["stdout"] is None and proc_info["stderr"] is None:
            try:
                stdout_output, stderr_output = process.communicate(timeout=10)
                proc_info["stdout"] = stdout_output
                proc_info["stderr"] = stderr_output
            except subprocess.TimeoutExpired:
                process.kill()
                stdout_output, stderr_output = process.communicate()
                proc_info["stdout"] = stdout_output + "\n[TIMEOUT EXPIRED, PROCESS KILLED]"
                proc_info["stderr"] = stderr_output
            except Exception as e:
                proc_info["stdout"] = f"[Error capturing stdout: {e}]"
                proc_info["stderr"] = f"[Error capturing stderr: {e}]"

        stdout_log = proc_info["stdout"]
        stderr_log = proc_info["stderr"]

        print(f"--- Subprocess PID {pid} STDOUT ---")
        print(stdout_log if stdout_log else "<No stdout>")
        print(f"--- Subprocess PID {pid} STDERR ---")
        print(stderr_log if stderr_log else "<No stderr>")
        print(f"------------------------------------")
        print(f"Process PID {pid} finished with return code: {poll_result}")

        # --- MODIFICATION: Commented out temp file deletion ---
        # if temp_config_file_path and os.path.exists(temp_config_file_path):
        #     try:
        #         os.remove(temp_config_file_path)
        #         print(f"Cleaned up temporary config file: {temp_config_file_path}")
        #         # To prevent trying to delete it again if this endpoint is called multiple times after completion:
        #         # running_processes[pid]["temp_config_file_path"] = None
        #     except Exception as e:
        #         print(f"Error cleaning up temp config file {temp_config_file_path}: {e}")
        # else:
        #     print(f"Temporary config file for PID {pid} was not found or already cleaned: {temp_config_file_path}")
        print(f"Temporary config file for PID {pid} ({proc_info.get('temp_config_file_path')}) is intentionally preserved.")


        plot_exists = os.path.exists(svg_filepath)
        print(f"Checking for plot file at: {svg_filepath} - Exists: {plot_exists}")

        if plot_exists:
            message = "Simulation completed successfully. Plot is ready."
            if poll_result != 0:
                message = f"Simulation completed (code: {poll_result}), plot is available. Check logs for potential issues."
            return jsonify({
                "status": "completed",
                "pid": pid,
                "message": message,
                "svg_filename": svg_filename,
                "plot_ready": True,
                "return_code": poll_result,
                "stdout": stdout_log,
                "stderr": stderr_log
            }), 200
        else:
            error_message = f"Simulation completed, but plot file '{svg_filename}' was not found. Check simulation logs."
            if poll_result != 0:
                error_message = f"Simulation completed with error (code: {poll_result}) and plot file '{svg_filename}' was not found. Check simulation logs."
            return jsonify({
                "status": "completed_error",
                "pid": pid,
                "message": error_message,
                "plot_ready": False,
                "return_code": poll_result,
                "svg_filename": svg_filename,
                "stdout": stdout_log,
                "stderr": stderr_log
            }), 200

@app.route('/plots/<filename>')
def get_plot(filename):
    print(f"Request for plot: {filename}")
    if '..' in filename or filename.startswith('/'):
        return jsonify({"status": "error", "message": "Invalid filename."}), 400
    
    file_path = os.path.abspath(os.path.join(PLOT_OUTPUT_DIR, filename))
    if not os.path.exists(file_path):
        print(f"Plot file not found at: {file_path}")
        return jsonify({"status": "error", "message": "Plot file not found."}), 404

    print(f"Serving plot: {file_path}")
    return send_from_directory(PLOT_OUTPUT_DIR, filename, as_attachment=False)

@app.route('/pause_simulation', methods=['POST'])
def pause_simulation():
    pid = request.json.get('pid')
    print(f"Received request to PAUSE simulation with PID: {pid} (Not implemented yet)")
    return jsonify({"status": "pending", "message": "Pause functionality not yet implemented."}), 501

@app.route('/reset_simulation', methods=['POST'])
def reset_simulation():
    pid_to_reset = request.json.get('pid') # Renamed to avoid conflict with loop variable
    print(f"Received request to RESET simulation with PID: {pid_to_reset}")
    if pid_to_reset in running_processes:
        proc_info = running_processes[pid_to_reset]
        process = proc_info["process"]
        svg_filename = proc_info["svg_filename"]
        temp_config_file_path = proc_info.get("temp_config_file_path")

        try:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
                print(f"Terminated process PID {pid_to_reset}")

            # --- MODIFICATION: Decide if temp file should be deleted on RESET ---
            # For now, let's keep it consistent with the user's request for it to remain after a normal run.
            # If you want reset to clean it up, uncomment the os.remove line below.
            if temp_config_file_path and os.path.exists(temp_config_file_path):
                # os.remove(temp_config_file_path)
                # print(f"Cleaned up temp config file during reset: {temp_config_file_path}")
                print(f"Temp config file {temp_config_file_path} intentionally preserved during reset.")
            else:
                print(f"Temp config file for PID {pid_to_reset} not found or already cleaned during reset.")


            svg_filepath = os.path.abspath(os.path.join(PLOT_OUTPUT_DIR, svg_filename))
            if os.path.exists(svg_filepath):
                os.remove(svg_filepath)
                print(f"Cleaned up plot file: {svg_filepath}")

            del running_processes[pid_to_reset]
            return jsonify({"status": "success", "message": f"Simulation PID {pid_to_reset} reset."}), 200
        except Exception as e:
            print(f"Error during reset for PID {pid_to_reset}: {e}")
            if pid_to_reset in running_processes:
                 del running_processes[pid_to_reset]
            return jsonify({"status": "error", "message": f"Error resetting simulation: {e}"}), 500
    else:
        return jsonify({"status": "error", "message": "Process ID not found for reset."}), 404

if __name__ == '__main__':
    print(f"MOOSE Script Path: {MOOSE_SCRIPT_PATH}")
    print(f"Plot Output Directory (absolute): {os.path.abspath(PLOT_OUTPUT_DIR)}")
    print(f"Temporary Config Directory (absolute): {os.path.abspath(TEMP_CONFIG_DIR)}")
    app.run(debug=True, port=5000)

