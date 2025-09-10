# This program interfaces to the jardesigner GUI for 3D rendering.
# Copyright (C) Upinder S. Bhalla NCBS 2025
# This program is licensed under the GNU Public License version 3.

from pathlib import Path
import numpy as np
import moose
import re
import requests
import json
import webbrowser
import pathlib
import os
import sys
import importlib.resources

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
        'dataType': 'Volume', 'vmin':0.0, 'vmax':1000.0 },
    'other': {'fieldScale': 1, 'dataUnits': '#', 
        'dataType': 'plot', 'vmin':0.0, 'vmax':1.0 },
}

def objPath( obj, splitLevel ):
    split = obj.path.split('/')
    if splitLevel == 1:
        ret = split[-1]
    elif splitLevel == 2:
        if len( split ) >= 2:
            ret = f"{split[-2]}/{split[-1]}"
        else:
            return objPath( obj, 1 )
    elif splitLevel == 3:
        if len( split ) >= 3:
            ret = f"{split[-3]}/{split[-2]}/{split[-1]}"
        else:
            return objPath( obj, 2 )

    if obj.dataIndex > 0 and ret[-1] != ']':
        return f"{ret}[{obj.dataIndex}]"
    elif obj.dataIndex == 0 and ret[-1] == ']':
        idx = ret.rfind( '[' )
        return ret[:idx]
    else:
        return ret

def getObjListInfo( objList ):
    ''' Returns a list of paths and a list of [x,y,z,dia] of the centers 
    of each object in the objList '''

    if len( objList ) == 0:
        return [], []
    elm = objList[0]
    if elm.isA["PoolBase"]:
        paths = [objPath( ee, 3 ) for ee in objList ]
        coords = [ ee.coords for ee in objList ]
        for cc in coords:
            cc[6] *= 2
    elif elm.isA["CompartmentBase"]:
        paths = [objPath( ee, 1 ) for ee in objList ]
        coords = [ ee.coords for ee in objList ]
    elif elm.isA["ChanBase"] or elm.isA["CaConcBase"]:
        paths = [objPath( ee, 2 ) for ee in objList ]
        coords = [ ee.parent.coords  for ee in objList ]
    else:
        return [], []

    return paths, coords
    
class Segment():
    def __init__( self, shape, coords, simId, simPath, swcType, idx, value = 0 ):
        self.shape = shape
        self.C = list(coords[3:6]) if shape == 'sphere' else list(coords[0:3])
        self.C2 = list(coords[3:6])
        self.diameter = coords[6]
        self.simId = simId
        self.simPath = simPath
        self.swcType = swcType
        self.shapeIdx = idx
        self.value = value

    def toDict( self ):
        return {
            "type": self.shape,
            "C": self.C,
            "C2": self.C2,
            "diameter": self.diameter,
            "value": self.value,
            "swcType": self.swcType,
            "shapeIdx": self.shapeIdx,
            "simId": self.simId,
            "simPath": self.simPath
        }
    
    @staticmethod
    def trimComptPath( path ):
        return Path( path ).name

    @staticmethod
    def trimMolPath( mol, dendName = "" ):
        p = Path( mol.path )
        intermediates = p.parts[4:-1]
        intermediatesPath = "/".join(intermediates)
        myName = p.parts[-1]
        chemComptName = p.parts[3] # Assumes /model/chem precede it.
        if chemComptName[-3:] == "[0]":
            chemComptName = chemComptName[:-3]
        if len( intermediatesPath ) > 0:
            ret = f"{dendName}/{chemComptName}/{intermediatesPath}/{myName}[{mol.dataIndex}]"
        else:
            ret = f"{dendName}/{chemComptName}/{myName}[{mol.dataIndex}]"
        #print( ret )
        return ret
    
    @staticmethod
    def simpleCompt( compt, idx ):
        if compt.name == "soma":
            return Segment( "sphere", compt.coords, compt.id.idValue, 
                Segment.trimComptPath( compt.path ), 1, idx, value = -0.1 )
        else:
            return Segment( "cylinder", compt.coords, compt.id.idValue, 
                Segment.trimComptPath( compt.path ), 4, idx, value = -0.1 )

    # === NEW: Method to represent IntFire objects as spheres ===
    @staticmethod
    def intFireCompt( compt, coords, idx ):
        # Use the provided coordinates, assume a default diameter.
        # Coords format: [x, y, z, x, y, z, diameter]
        new_coords = np.zeros(7)
        new_coords[0:3] = coords[0:3]
        new_coords[3:6] = coords[0:3] # Sphere C2 is same as C
        new_coords[6] = 10e-6 # Default diameter of 10 microns
        return Segment("sphere", new_coords, compt.id.idValue,
                Segment.trimComptPath(compt.path), 1, idx)

    @staticmethod
    def cylChemCompt( mol, idx ):
        parentDendName = mol.parent.subTree[0].name
        ret =  Segment( "cylinder", mol.coords, mol.id.idValue, 
            Segment.trimMolPath( mol, parentDendName ), 0, idx, value = -0.04 )
        ret.diameter *= 2           # Moose puts radius in coords[6]
        return ret

    @staticmethod
    def spineChemCompt( mol, idx ):
        newc = mol.coords[:7]
        newc[6] = mol.coords[9]   # For diameter
        return Segment( "cylinder", newc, mol.id.idValue, 
            Segment.trimMolPath( mol ), 0, idx )

    @staticmethod
    def presynChemCompt( mol, idx ):
        newc = np.array(mol.coords[:7])
        # Unit vector of cone direction is in coords[3:6], dia in coords[6]
        newc[3:6] = newc[3:6]*newc[6] + newc[0:3]   
        return Segment( "cone", newc, mol.id.idValue, 
            Segment.trimMolPath( mol ), 0, idx )

    @staticmethod
    def endoChemCompt( mol, idx ):
        newc = np.array(mol.coords[:7])
        newc[6] = newc[3] 
        newc[3:6] = newc[0:3]
        return Segment( "sphere", newc, mol.id.idValue, 
            Segment.trimMolPath( mol ), 0, idx )

    @staticmethod
    def trodeBase( path, newc, simId, idx, theta, value ):
        # Unit vector of cone direction is in coords[3:6], dia in coords[6]
        # Cone is 5 microns and is aligned in along unit vector towards y.
        # It touches cylinder at its surface.
        dx = np.cos( theta + idx * 0.1 )
        dy = np.sin( theta + idx * 0.1 )
        if path == "soma":
            newc[0:3] = newc[3:6]
        else:
            newc[3:6] = (newc[3:6] + newc[0:3])/2
            newc[0:3] = newc[3:6]
        newc[4] += newc[6]*dx * 0.55 # Just a small offset from the surface.
        newc[5] += newc[6]*dy * 0.55 # Just a small offset from the surface.
        newc[1] = newc[4] + dx * (0.5*newc[6] + 5e-6)
        newc[2] = newc[5] + dy * (0.5*newc[6] + 5e-6)
        return Segment( "cone", newc, simId, path, 0, idx, value = value )

    @staticmethod
    def plotTrode( path, newc, simId, idx ):
        return Segment.trodeBase( path, newc, simId, idx, 0, -0.01 )

    @staticmethod
    def stimTrode( path, newc, simId, idx ):
        # Same as above, except cone is along z.
        return Segment.trodeBase( path, newc, simId, idx, np.pi/2, 0.02 )

    @staticmethod
    def moogTrode( path, newc, simId, idx ):
        # Here I would really like to draw a little box, distinct icon.
        # For now, a cone at a different angle.
        return Segment.trodeBase( path, newc, simId, idx, np.pi* 1.25,0.05 )

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
            "diaScale": self.diaScale,
            "visible": self.visible,
            "shape": [ ss.toDict() for ss in self.segmentList ]
        }

    def getDataFrame( self, timestamp ):
        raise NotImplementedError

class MooseNeuronDataWrapper( DataWrapper ):
    def __init__( self, compts, fdict, groupId ): 
        fdict['transparency'] = fdict.get('transparency', 0.5)
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
            "viewId": "run",
            "timestamp": float(timestamp),
            "groupId": self.groupId,
            "data": values
        }

class MooseChemDataWrapper( DataWrapper ):
    def __init__( self, objList, fdict, groupId ):
        fdict['transparency'] = fdict.get('transparency', 0.8)
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
            "viewId": "run",
            "timestamp": float(timestamp),
            "groupId": self.groupId,
            "data": values
        }

class MooseTrodeDataWrapper( DataWrapper ):
    def __init__( self, objList, fdict, groupId ):
        fdict['transparency'] = fdict.get('transparency', 0.8)
        super().__init__(fdict, groupId )
        self.objList_ = objList
        if not objList:
            return
        
        objType = fdict['dataType']
        paths, coords = getObjListInfo( objList )
        if objType == "plot":
            self.segmentList = [ Segment.plotTrode( pp, cc, obj.id.idValue, idx ) for idx, (pp, cc, obj ) in enumerate( zip( paths, coords, objList) ) ]
        elif objType == "stim":
            self.segmentList = [ Segment.stimTrode( pp, cc, obj.id.idValue, idx ) for idx, (pp, cc, obj ) in enumerate( zip( paths, coords, objList) ) ]
        elif objType == "moogli":
            self.segmentList = [ Segment.moogTrode( pp, cc, obj.id.idValue, idx ) for idx, (pp, cc, obj ) in enumerate( zip( paths, coords, objList) ) ]
        '''
        '''

    def getDataFrame( self, timestamp ): # Dummy function, returns zeros.
        return {
            "filetype": "jardesignerDataFrame",
            "version": "1.0",
            "timestamp": float(timestamp),
            "groupId": self.groupId,
            "data": [0]* len( self.objList_ )
        }

class MooView:
    def __init__( self, dataChannelId, displayConfig = None ):
        self.drawables = []
        self.dataChannelId = dataChannelId
        self.standalone = ( dataChannelId == None )
        self.standaloneFrames = []
        self.standaloneSceneGraph = None
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
        if self.standalone:
            self.standaloneFrames.append( payload )
        else:
            try:
                http_session.post(FLASK_SERVER_URL, json=requestBody, timeout=0.5)
            except Exception as e:
                # This will now print any network errors to the server console
                print(f"ERROR in updateValues: Failed to send data frame. {e}")


    def makeMoogli(self, mooObj, fdict, groupId ):
        mooField = fdict.get('field', 'Vm')
        if mooField in ['n', 'conc']: # mooObj is the wildcard list
            dw = MooseChemDataWrapper(mooObj, fdict, groupId)
        elif mooField == 'other': # mooObj is objList
            dw = MooseTrodeDataWrapper(mooObj, fdict, groupId)
        else:
            dw = MooseNeuronDataWrapper(mooObj, fdict, groupId)
        self.drawables.append(dw)

    def updateMoogliViewer( self, idx ):
        if idx >= len(self.drawables):
            return
        simTime = moose.element( '/clock' ).currentTime
        #print( "called updateMoogliViewer for {} at {:.3f}".format( idx, simTime ) )
        self.updateValues( simTime, idx )

    def sendSceneGraph( self, viewId ):
        payload = {
            "type": "scene_init",
            "viewId": viewId,
            "scene": self.getSceneGraph()
        }
        requestBody = {
            "data_channel_id": self.dataChannelId,
            "payload": payload
        }
        if self.standalone:
            self.standaloneSceneGraph = payload['scene']
        else:
            try:
                requests.post(FLASK_SERVER_URL, json=requestBody, timeout=2.0)
                #print( "Sent Scene Graph: \n", requestBody )
            except Exception as e:
                print(f"FATAL ERROR: Could not send initial scene graph to server. {e}")
    

    def notifySimulationEnd( self, dataChannelId ):
        """
        Sends a final message to the client to signal that the simulation
        has completed.
        """
        if self.standalone:
            self.generateStandaloneHtml()
            return
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
            print("Sent simulation end notification.")
        except Exception as e:
            print(f"Warning: Could not send simulation end notification. {e}")
            # This was malformed. Correcting it.
            http_session.post(FLASK_SERVER_URL, json={
                "data_channel_id": dataChannelId,
                "payload": {"type": "error", "message": str(e)}
            })






    def generateStandaloneHtml(self, 
            templatePath ="jardes3Dtemplate.html", 
            outputPath = "jardes3Doutput.html"):
        """
        Generates a single, self-contained HTML file with embedded simulation data.

        Args:
            templatePath (str): The filename of the HTML template, assumed to be
                                in the same directory as the script.
            outputPath (str): The filename for the output HTML, which will be saved
                              in the current working directory.
        """
        try:
            absoluteOutputPath = os.path.join(os.getcwd(), outputPath)

            # 1. Read the HTML template file
            templateContent = importlib.resources.read_text('jardesigner', 'jardes3Dtemplate.html')
            '''
            scriptDir = os.path.dirname(os.path.realpath(sys.argv[0]))
            absoluteTemplatePath = os.path.join(scriptDir, templatePath)

            # Resolve the output path relative to the current working directory
            absoluteOutputPath = os.path.join(os.getcwd(), outputPath)

            # 1. Read the HTML template file
            with open(absoluteTemplatePath, 'r') as f:
                templateContent = f.read()
            '''

            # 2. Serialize the collected data into JSON strings
            sceneGraphJson = json.dumps(self.standaloneSceneGraph)
            framesJson = json.dumps(self.standaloneFrames)

            # 3. Inject the data by replacing placeholders in the template
            # NOTE: The placeholders in your template should now match exactly,
            # including the single quotes.
            content = templateContent.replace(
                "'__PLACEHOLDER_FOR_SCENE_CONFIG__'", sceneGraphJson
            )
            content = content.replace(
                "'__PLACEHOLDER_FOR_SIMULATION_FRAMES__'", framesJson
            )

            # 4. Save the new, data-filled HTML file
            with open(absoluteOutputPath, 'w') as f:
                f.write(content)

            print(f"Generated standalone view at: {absoluteOutputPath}")

            # 5. Open the generated file in the default web browser
            fileUrl = pathlib.Path(absoluteOutputPath).resolve().as_uri()
            print("Opening view in default web browser...")
            webbrowser.open(fileUrl)

        except FileNotFoundError:
            print(f"FATAL ERROR: HTML template not found at '{absoluteTemplatePath}'")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
