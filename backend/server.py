import os
import json
import tempfile
import subprocess # Make sure subprocess is imported
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS # Import CORS

# --- Configuration ---
# Get the directory where this script is located
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Define where temporary config files will be stored
TEMP_CONFIG_DIR = os.path.join(BASE_DIR, 'temp_configs')
# Define the name of your MOOSE script
MOOSE_SCRIPT_NAME = "jardesigner.py"
MOOSE_SCRIPT_PATH = os.path.join(BASE_DIR, MOOSE_SCRIPT_NAME)

# Ensure the temporary directory exists
os.makedirs(TEMP_CONFIG_DIR, exist_ok=True)

# --- Flask App Initialization ---
app = Flask(__name__)
# --- Enable CORS ---
CORS(app)

# --- Store running process info (simple example) ---
# In a real app, you might need a more robust way to track processes
running_processes = {}

# --- API Endpoints ---

@app.route('/')
def index():
    """ Basic route to check if the server is running. """
    return jsonify({"message": "Flask backend is running!"})

@app.route('/launch_simulation', methods=['POST'])
def launch_simulation():
    """
    Receives JSON configuration, saves it temporarily,
    and launches the MOOSE simulation script.
    """
    print("Received request for /launch_simulation") # Log request
    try:
        # Get JSON data from the request body
        config_data = request.json
        if not config_data or not isinstance(config_data, dict):
            print("Error: Invalid or missing JSON data in request.")
            return jsonify({"status": "error", "message": "Invalid or missing JSON data"}), 400

        print(f"Received config data: {json.dumps(config_data, indent=2)}") # Log received data

        # --- Create a temporary file to store the config ---
        temp_file_path = None # Initialize path
        try:
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.json',
                prefix='config_',
                encoding='utf-8',
                dir=TEMP_CONFIG_DIR,
                delete=False # Keep the file so the subprocess can read it
            ) as temp_file:
                json.dump(config_data, temp_file, indent=2)
                temp_file_path = temp_file.name
            print(f"Configuration saved temporarily to: {temp_file_path}")
        except Exception as e:
            print(f"Error saving temporary config file: {e}")
            return jsonify({"status": "error", "message": f"Could not save config file: {e}"}), 500

        # --- Execute the MOOSE script using subprocess.Popen ---
        # Check if the script exists
        if not os.path.exists(MOOSE_SCRIPT_PATH):
             print(f"Error: MOOSE script not found at {MOOSE_SCRIPT_PATH}")
             # Clean up the temp file if script not found
             if temp_file_path and os.path.exists(temp_file_path):
                 os.remove(temp_file_path)
             return jsonify({"status": "error", "message": f"MOOSE script '{MOOSE_SCRIPT_NAME}' not found in backend directory."}), 500

        # Construct the command
        # Ensure you use the correct python executable if needed (e.g., 'python3' or path from venv)
        command = ["python", MOOSE_SCRIPT_PATH, temp_file_path]
        print(f"Executing command: {' '.join(command)}")

        try:
            # Use Popen for non-blocking execution
            # Run from the directory containing the script
            # Capture stdout/stderr if needed later for status/results
            process = subprocess.Popen(
                command,
                cwd=BASE_DIR,
                stdout=subprocess.PIPE, # Optional: Capture output
                stderr=subprocess.PIPE, # Optional: Capture errors
                text=True # Decode stdout/stderr as text
            )
            print(f"Started MOOSE process with PID: {process.pid}")

            # Store process info (simple example, might need better tracking)
            # Using temp_file_path as a simple key, could use UUIDs
            running_processes[temp_file_path] = process

            # Optional: Start threads to read stdout/stderr without blocking
            # (More advanced, needed for Phase 3/4)

        except Exception as e:
            print(f"Error launching MOOSE script: {e}")
            # Clean up temp file if launch fails
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return jsonify({"status": "error", "message": f"Failed to launch MOOSE script: {e}"}), 500

        # Return success response to the frontend
        return jsonify({
            "status": "success",
            "message": f"MOOSE simulation started (PID: {process.pid}).",
            "config_file": temp_file_path, # Send back the path for info
            "pid": process.pid # Send back PID for potential future control
            }), 200

    except Exception as e:
        print(f"Error processing /launch_simulation request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"An unexpected error occurred: {e}"}), 500

# --- Add Placeholder Endpoints for Future Control ---
# These don't do anything yet but set up the structure for Phase 2

@app.route('/pause_simulation', methods=['POST'])
def pause_simulation():
    # TODO: Implement pausing logic (e.g., find PID, send signal)
    pid = request.json.get('pid')
    print(f"Received request to PAUSE simulation with PID: {pid} (Not implemented yet)")
    return jsonify({"status": "pending", "message": "Pause functionality not yet implemented."}), 501 # 501 Not Implemented

@app.route('/reset_simulation', methods=['POST'])
def reset_simulation():
    # TODO: Implement reset logic (e.g., find PID, terminate, maybe cleanup temp file)
    pid = request.json.get('pid')
    print(f"Received request to RESET simulation with PID: {pid} (Not implemented yet)")
    # Example cleanup (be careful with this):
    # config_file = request.json.get('config_file')
    # if config_file and os.path.exists(config_file):
    #     try:
    #         os.remove(config_file)
    #         print(f"Cleaned up config file: {config_file}")
    #     except Exception as e:
    #         print(f"Error cleaning up config file {config_file}: {e}")
    return jsonify({"status": "pending", "message": "Reset functionality not yet implemented."}), 501 # 501 Not Implemented


# --- Run the Flask App ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

