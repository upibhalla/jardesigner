import sys
import os

# Ensure the current directory is in the path so we can import 'jardesigner'
sys.path.append(os.getcwd())

# Import the main function from your backend module
# This uses the standard import mechanism, avoiding the "double load"
from jardesigner.jardesigner import main 

if __name__ == "__main__":
    sys.exit(main())

