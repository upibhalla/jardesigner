# This variable will hold the shared JarDesigner instance.
# It's private to this module.
_rdes_instance = None

def setContext(instance):
    """
    Called by the main script to register the JarDesigner instance.
    """
    global _rdes_instance
    _rdes_instance = instance

def getContext():
    """
    Called by any other module that needs access to the instance.
    """
    return _rdes_instance
