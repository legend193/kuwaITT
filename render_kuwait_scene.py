import bpy

# 1. Configure Render Engine
scene = bpy.context.scene
# In Blender 4.2+ / 5.0+, Eevee Next is 'BLENDER_EEVEE_NEXT' or 'BLENDER_EEVEE'
valid_engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
print("Available render engines:", valid_engines)
if "BLENDER_EEVEE_NEXT" in valid_engines:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
elif "BLENDER_EEVEE" in valid_engines:
    scene.render.engine = "BLENDER_EEVEE"
elif "CYCLES" in valid_engines:
    scene.render.engine = "CYCLES"

# 2. Render Resolution
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.filepath = "C:/Users/Mabar/OneDrive/Desktop/kuwait/kuwait_masterpiece_render.png"
scene.render.image_settings.file_format = 'PNG'

# 3. Adjust Viewport in 3D View to Material Preview & Camera View
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
                # Switch to camera view
                if space.region_3d:
                    space.region_3d.view_perspective = 'CAMERA'

# 4. Render the still image
print("Starting render...")
bpy.ops.render.render(write_still=True)
print("Render completed and saved to:", scene.render.filepath)
