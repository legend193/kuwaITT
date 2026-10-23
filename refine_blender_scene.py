import bpy
import math

# 1. Apply Smooth Shading to all mesh objects in scene
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        for poly in obj.data.polygons:
            poly.use_smooth = True

# 2. Setup Focus Target Empty for Camera
target = bpy.data.objects.get("CameraTarget")
if not target:
    target = bpy.data.objects.new("CameraTarget", None)
    bpy.context.scene.collection.objects.link(target)
target.location = (4.0, 5.0, 13.0) # Center of Towers height

# 3. Adjust Camera Position & Framing
cam = bpy.context.scene.camera
if cam:
    cam.location = (36.0, -32.0, 11.0)
    # Add TrackTo constraint if not present
    track = cam.constraints.get("TrackToTarget")
    if not track:
        track = cam.constraints.new(type='TRACK_TO')
        track.name = "TrackToTarget"
        track.target = target
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'
    cam.data.lens = 28.0 # Wide angle to capture the majesty of the towers

# 4. Render
bpy.context.scene.render.resolution_x = 1280
bpy.context.scene.render.resolution_y = 720
bpy.context.scene.render.filepath = "C:/Users/Mabar/OneDrive/Desktop/kuwait/kuwait_masterpiece_render.png"
bpy.ops.render.render(write_still=True)
print("Updated render finished successfully!")
