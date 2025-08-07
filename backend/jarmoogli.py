# This program interfaces to the jardesigner GUI for 3D rendering.
# Copyright (C) Upinder S. Bhalla NCBS 2025
# This program is licensed under the GNU Public License version 3.

from pathlib import Path
import numpy as np
import moose
import re
import requests
import json

# Define the URL for the internal server endpoint
FLASK_SERVER_URL = "http://127.0.0.1:5000/internal/push_data"

# --- MODIFIED: Create a single session object for reuse ---
http_session = requests.Session()

knownFieldInfo = {
    'Vm': {'fieldScale': 1000, 'dataUnits': 'mV', 
        'dataType': 'Memb. Potential', 'vmin':-80.0, 'vmax':40.0 },
    'initVm': {'fieldScale': 1000, 'dataUnits': 'mV', 
        'dataType': 'Initial Memb. Potential', 'vmin':-80.0, 'vmax':40.0 },
    'Im': {'fieldScale': 1e9, 'dataUnits': 'nA', 
        'dataType': 'Memb current', 'vmin':-10.0, 'vmax':10.0 },
    'inject': {'fieldScale': 1e9, 'dataUnits': 'nA', 
        'dataType': 'Injection current', 'vmin':-10.0, 'vmax':10.0 },
    'Gbar': {'fieldScale': 1e9, 'dataUnits': 'nS', 
        'dataType': 'Max chan conductance', 'vmin': 0.0, 'vmax':1.0 },
    'Gk': {'fieldScale': 1e9, 'dataUnits': 'nS', 
        'dataType': 'Chan conductance', 'vmin': 0.0, 'vmax':1.0 },
    'Ik': {'fieldScale': 1e9, 'dataUnits': 'nA', 
        'dataType': 'Chan current', 'vmin':-10.0, 'vmax':10.0 },
    'ICa': {'fieldScale': 1e9, 'dataUnits': 'nA', 
        'dataType': 'Ca current', 'vmin':-10.0, 'vmax':10.0 },
    'Ca': {'fieldScale': 1e3, 'dataUnits': 'uM', 
        'dataType': 'Ca conc', 'vmin':0.0, 'vmax':10.0 },
    'conc': {'fieldScale': 1e3, 'dataUnits': 'uM', 
        'dataType': 'Concentration', 'vmin':0.0, 'vmax':2.0 },
    'n': {'fieldScale': 1, 'dataUnits': '#', 
        'dataType': '# of molecules', 'vmin':0.0, 'vmax':200.0 },
    'volume': {'fieldScale': 1e18, 'dataUnits': 'um^3', 
        'dataType': 'Volume', 'vmin':0.0, 'vmax':1000.0 }
}

class Segment():
    def __init__( self, shape, coords, simId, simPath, swcType, idx ):
        self.shape = shape
        self.C = list(coords[3:6]) if shape == 'sphere' else list(coords[0:3])
        self.C2 = list(coords[3:6])
        self.diameter = coords[6]
        self.simId = simId
        self.simPath = simPath
        self.swcType = swcType
        self.shapeIdx = idx

    def toDict( self ):
        return {
            "type": self.shape,
            "C": self.C,
            "C2": self.C2,
            "diameter": self.diameter,
            "value": 0,
            "swcType": self.swcType,
            "shapeIdx": self.shapeIdx,
            "simId": self.simId.idValue,
            "simPath": self.simPath
        }
    
    @staticmethod
    def trimComptPath( path ):
        return Path( path ).name

    @staticmethod
    def trimMolPath( path ):
        p = Path( path )
        return str(Path( *p.parts[-2:] ))
    
    @staticmethod
    def simpleCompt( compt, idx ):
        if compt.name == "soma":
            return Segment( "sphere", compt.coords, compt.id, 
                Segment.trimComptPath( compt.path ), 1, idx )
        else:
            return Segment( "cylinder", compt.coords, compt.id, 
                Segment.trimComptPath( compt.path ), 4, idx )

    # === NEW: Method to represent IntFire objects as spheres ===
    @staticmethod
    def intFireCompt( compt, coords, idx ):
        # Use the provided coordinates, assume a default diameter.
        # Coords format: [x, y, z, x, y, z, diameter]
        new_coords = np.zeros(7)
        new_coords[0:3] = coords[0:3]
        new_coords[3:6] = coords[0:3] # Sphere C2 is same as C
        new_coords[6] = 10e-6 # Default diameter of 10 microns
        return Segment("sphere", new_coords, compt.id,
                Segment.trimComptPath(compt.path), 1, idx)

    @staticmethod
    def cylChemCompt( compt, idx ):
        ret =  Segment( "cylinder", compt.coords, compt.id, 
            Segment.trimMolPath( compt.path ), 0, idx )
        ret.diameter *= 2           # Moose puts radius in coords[6]
        return ret

    @staticmethod
    def spineChemCompt( compt, idx ):
        newc = compt.coords[:7]
        newc[6] = compt.coords[9]   # For diameter
        return Segment( "cylinder", newc, compt.id, 
            Segment.trimMolPath( compt.path ), 0, idx )

    @staticmethod
    def prsynChemCompt( compt, idx ):
        newc = np.array(compt.coords[:7])
        # Unit vector of cone direction ins in coords[3:6], dia in coords[6]
        newc[3:6] = newc[3:6]*newc[6] + newc[0:3]   
        return Segment( "cone", newc, compt.id, 
            Segment.trimMolPath( compt.path ), 0, idx )

    @staticmethod
    def endoChemCompt( compt, idx ):
        newc = np.array(compt.coords[:7])
        newc[6] = newc[3] 
        newc[3:6] = newc[0:3]
        return Segment( "sphere", newc, compt.id, 
            Segment.trimMolPath( compt.path ), 0, idx )

def extractUnits( text ):
    match = re.search(r'\((.*?)\)', text)
    if match:
        return match.group(1)
    return "Numbers"

class DataWrapper:
    def __init__( self, fdict, groupId ):
        self.title = fdict['title']
        self.groupId = groupId
        #self.path = fdict['path']
        self.field = fdict['field']
        self.relObjPath_ = fdict['relpath']
        fieldInfo = knownFieldInfo[self.field]
        self.dataType = fieldInfo['dataType']
        self.fieldScale_ = fieldInfo['fieldScale']
        self.dataUnits = fieldInfo['dataUnits']
        default_vmin = fieldInfo['vmin']
        default_vmax = fieldInfo['vmax']

        if fdict.get('vmin') is not None and fdict.get('vmax') is not None and fdict['vmin'] != fdict['vmax']:
            self.vmin = fdict['vmin']
            self.vmax = fdict['vmax']
        else:
            self.vmin = default_vmin
            self.vmax = default_vmax
            
        self.diaScale = fdict.get('diaScale', 1.0)
        self.transparency = fdict.get('transparency', 0.5)
        self.dt = fdict.get('dt', 0.001)
        self.visible = fdict.get('visible', True)
        self.objList_ = []
        self.segmentList = []

    def toDict( self ):
        return {
            "title": self.title,
            "groupId": self.groupId,
            "dataType": self.dataType,
            "dataUnits": self.dataUnits,
            "vmin": self.vmin,
            "vmax": self.vmax,
            "dt": self.dt,
            "transparency": self.transparency,
            "visible": self.visible,
            "shape": [ ss.toDict() for ss in self.segmentList ]
        }

    def getDataFrame( self, timestamp ):
        raise NotImplementedError

class MooseNeuronDataWrapper( DataWrapper ):
    def __init__( self, compts, fdict, groupId ): 
        super().__init__(fdict, groupId )
        #self.neuronId_ = neuronId
        self.dummyObj = None
        if self.field == "Ca":
            self.dummyObj = moose.CaConc( "/dummyCa" )
        elif self.field in ["Ik","Gk", "Ek", "Gbar", "modulation"]:
            self.dummyObj = moose.SynChan( "/dummySynChan" )

        # === RESTORED: Logic to handle both Compartment and IntFire types ===
        #compts = moose.wildcardFind( neuronId.path + "/#[ISA=CompartmentBase]" )
        # Need a cleaner check for IntFires.
        if len(compts) > 0:
            self.segmentList = [ Segment.simpleCompt( cc, idx ) for idx, cc in enumerate( compts ) ]
        else:
            #compts = moose.wildcardFind( neuronId.path + "/#[ISA=IntFire]" )
            if len(compts) > 0:
                # For IntFire, we need to fetch coordinates separately.
                coords_vec = moose.vec( compts[0].path + "/coords" )
                coords_list = [coords_vec[i] for i in range(len(coords_vec))]
                self.segmentList = [ Segment.intFireCompt(cc, cd, idx) for idx, (cc, cd) in enumerate(zip(compts, coords_list)) ]
            else:
                print("Error: MooseNeuronDataWrapper found neither CompartmentBase nor IntFire objects.")
        
        if self.relObjPath_ == ".":
            self.objList_ = compts
        else:
            self.objList_ = []
            for i in compts:
                path_to_check = i.path + '/' + self.relObjPath_
                if moose.exists( path_to_check ):
                    self.objList_.append(moose.element(path_to_check))
                elif self.dummyObj:
                    self.objList_.append(self.dummyObj)

    def getDataFrame( self, timestamp ):
        fs = self.fieldScale_
        values = [fs*float(moose.getField(i, self.field)) for i in self.objList_]
        return {
            "filetype": "jardesignerDataFrame",
            "version": "1.0",
            "timestamp": float(timestamp),
            "groupId": self.groupId,
            "data": values
        }

class MooseChemDataWrapper( DataWrapper ):
    def __init__( self, objList, fdict, groupId ):
        super().__init__(fdict, groupId )
        self.objList_ = objList
        if not objList:
            return
        
        meshType = objList[0].parent.className
        if meshType in ["NeuroMesh", "CylMesh", "PsdMesh"]:
            self.segmentList = [ Segment.cylChemCompt( cc, idx ) for idx, cc in enumerate( objList ) ]
        elif meshType == "SpineMesh":
            self.segmentList = [ Segment.spineChemCompt( cc, idx ) for idx, cc in enumerate( objList ) ]
        elif meshType == "PresynMesh":
            self.segmentList = [ Segment.presynChemCompt( cc, idx ) for idx, cc in enumerate( objList ) ]
        elif meshType == "EndoMesh":
            self.segmentList = [ Segment.endoChemCompt( cc, idx ) for idx, cc in enumerate( objList ) ]

    def getDataFrame( self, timestamp ):
        values = [float(moose.getField(i, self.field)) for i in self.objList_]
        return {
            "filetype": "jardesignerDataFrame",
            "version": "1.0",
            "timestamp": float(timestamp),
            "groupId": self.groupId,
            "data": values
        }

class MooView:
    def __init__( self, dataChannelId, displayConfig = None ):
        self.drawables = []
        self.dataChannelId = dataChannelId
        if displayConfig:
            self.displayConfig = displayConfig
        else:
            self.displayConfig = {
                "filetype": "jardesignerSceneGraph",
                "version": "1.0",
                "wallClockDt": 1000,
                "runtime": 0.01,
                "rotation": 0.0,
                "azim": 0,
                "elev": 0,
                "mergeDisplays": True,
                "colormap": "jet",
                "bg": "white",
                "block": True,
                "fullscreen": False,
                "center": [0,0,0]
            }

    def getSceneGraph(self):
        return {
            **self.displayConfig,
            "drawables": [d.toDict() for d in self.drawables]
        }
        
    def updateValues( self, simTime, idx ):
        if idx >= len(self.drawables):
            return

        payload = self.drawables[idx].getDataFrame( simTime )
        
        requestBody = {
            "data_channel_id": self.dataChannelId,
            "payload": payload,
        }
        try:
            # --- MODIFIED: Use the session object and print errors ---
            http_session.post(FLASK_SERVER_URL, json=requestBody, timeout=0.5)
        except Exception as e:
            # This will now print any network errors to the server console
            print(f"ERROR in updateValues: Failed to send data frame. {e}")


    def makeMoogli(self, mooObj, fdict, groupId ):
        mooField = fdict.get('field', 'Vm')
        if mooField in ['n', 'conc']: # mooObj is the wildcard list
            dw = MooseChemDataWrapper(mooObj, fdict, groupId)
        else:
            dw = MooseNeuronDataWrapper(mooObj, fdict, groupId)
        self.drawables.append(dw)

    def updateMoogliViewer( self, idx ):
        if idx >= len(self.drawables):
            return
        simTime = moose.element( '/clock' ).currentTime
        # This print statement was removed in the previous turn but is being re-added for clarity in the final file
        print( "called updateMoogliViewer for {} at {:.3f}".format( idx, simTime ) )
        self.updateValues( simTime, idx )

    def sendSceneGraph( self ):
        payload = {
            "type": "scene_init",
            "scene": self.getSceneGraph()
        }
        requestBody = {
            "data_channel_id": self.dataChannelId,
            "payload": payload
        }
        try:
            print("Attempting to send initial scene graph to server...")
            requests.post(FLASK_SERVER_URL, json=requestBody, timeout=2.0)
            print("Successfully sent initial scene graph.")
        except Exception as e:
            print(f"FATAL ERROR: Could not send initial scene graph to server. {e}")


#### Global function for ending simulation. ####

def notifySimulationEnd( dataChannelId ):
    """
    Sends a final message to the client to signal that the simulation
    has completed.
    """
    print("Sending simulation end notification to client...")
    payload = {
        "type": "sim_end",
        "message": "Simulation has finished."
    }
    requestBody = {
        "data_channel_id": dataChannelId,
        "payload": payload
    }
    try:
        requests.post(FLASK_SERVER_URL, json=requestBody, timeout=2.0)
        print("Successfully sent simulation end notification.")
    except Exception as e:
        print(f"Warning: Could not send simulation end notification. {e}")
        # This was malformed. Correcting it.
        http_session.post(FLASK_SERVER_URL, json={
            "data_channel_id": dataChannelId,
            "payload": {"type": "error", "message": str(e)}
        })
