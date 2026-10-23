import bpy
import math
import mathutils

def create_kuwait_masterpiece():
    # 1. Reset / Clear existing meshes and default objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # 2. Setup World Environment & Lighting
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("KuwaitWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs[0].default_value = (0.35, 0.65, 0.88, 1.0) # Warm sky blue
        bg_node.inputs[1].default_value = 1.2 # Strength

    # Sun Light (Golden Hour Arabian Sun)
    sun_data = bpy.data.lights.new(name="ArabianSun", type='SUN')
    sun_data.energy = 5.5
    sun_data.color = (1.0, 0.92, 0.78) # Warm golden sunlight
    sun_data.angle = math.radians(2.0)
    sun_obj = bpy.data.objects.new(name="ArabianSun", object_data=sun_data)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(48), math.radians(18), math.radians(-35))

    # Helper function for Principled BSDF Materials
    def make_material(name, base_color, metallic=0.0, roughness=0.5, specular=0.5, transmission=0.0):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
        # Check socket names for compatibility with Blender 4/5
        for input_name, val in [
            ("Base Color", base_color),
            ("Metallic", metallic),
            ("Roughness", roughness),
            ("Specular IOR Level", specular) if "Specular IOR Level" in bsdf.inputs else ("Specular", specular),
            ("Transmission Weight", transmission) if "Transmission Weight" in bsdf.inputs else ("Transmission", transmission)
        ]:
            if input_name in bsdf.inputs:
                bsdf.inputs[input_name].default_value = val
        return mat

    # Materials
    mat_concrete = make_material("TowerConcrete", (0.92, 0.94, 0.95, 1.0), metallic=0.1, roughness=0.35)
    mat_sphere_main = make_material("TowerSphereTeal", (0.08, 0.62, 0.68, 1.0), metallic=0.85, roughness=0.12)
    mat_sphere_secondary = make_material("TowerSphereDeepBlue", (0.04, 0.38, 0.58, 1.0), metallic=0.88, roughness=0.14)
    mat_gold_spire = make_material("SpireGold", (0.95, 0.78, 0.25, 1.0), metallic=0.95, roughness=0.18)
    mat_teak_wood = make_material("DhowTeakWood", (0.28, 0.16, 0.08, 1.0), metallic=0.02, roughness=0.75)
    mat_deck_wood = make_material("DhowDeckWood", (0.45, 0.30, 0.16, 1.0), metallic=0.0, roughness=0.82)
    mat_sail_canvas = make_material("SailCanvas", (0.96, 0.93, 0.85, 1.0), metallic=0.0, roughness=0.9)
    mat_desert_sand = make_material("DesertSand", (0.86, 0.72, 0.48, 1.0), metallic=0.02, roughness=0.88)
    mat_sea_water = make_material("ArabianGulfSea", (0.04, 0.48, 0.55, 1.0), metallic=0.1, roughness=0.08, transmission=0.45)
    mat_flag_green = make_material("FlagGreen", (0.0, 0.48, 0.22, 1.0), roughness=0.6)
    mat_flag_white = make_material("FlagWhite", (0.95, 0.95, 0.95, 1.0), roughness=0.6)
    mat_flag_red = make_material("FlagRed", (0.82, 0.08, 0.12, 1.0), roughness=0.6)
    mat_flag_black = make_material("FlagBlack", (0.08, 0.08, 0.08, 1.0), roughness=0.7)

    # =========================================================================
    # 3. أبراج الكويت الشامخة (Kuwait Towers Architecture)
    # =========================================================================
    towers_col = bpy.data.collections.new("KuwaitTowers")
    bpy.context.scene.collection.children.link(towers_col)

    # Base Podium (المنصة الساحلية)
    bpy.ops.mesh.primitive_cylinder_add(radius=14.0, depth=0.8, vertices=48, location=(0, 0, 0.4))
    podium = bpy.context.active_object
    podium.name = "TowersPodium"
    podium.data.materials.append(make_material("PodiumStone", (0.25, 0.45, 0.35, 1.0), roughness=0.9))
    towers_col.objects.link(podium)
    bpy.context.collection.objects.unlink(podium)

    # Main Tower (البرج الرئيسي - 187 متر تناسبياً)
    # Column
    bpy.ops.mesh.primitive_cone_add(radius1=2.8, radius2=0.45, depth=26.0, vertices=32, location=(0, 0, 13.0))
    main_col = bpy.context.active_object
    main_col.name = "MainTowerColumn"
    main_col.data.materials.append(mat_concrete)
    towers_col.objects.link(main_col)
    bpy.context.collection.objects.unlink(main_col)

    # Main Lower Sphere (الكرة الكبرى - مطعم وخزان)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=4.2, segments=48, ring_count=24, location=(0, 0, 12.5))
    sphere1 = bpy.context.active_object
    sphere1.name = "MainTowerSphere1"
    sphere1.data.materials.append(mat_sphere_main)
    towers_col.objects.link(sphere1)
    bpy.context.collection.objects.unlink(sphere1)

    # Main Upper Sphere (الكرة العليا - المرصد الكاشف)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=2.3, segments=36, ring_count=18, location=(0, 0, 18.2))
    sphere2 = bpy.context.active_object
    sphere2.name = "MainTowerSphere2"
    sphere2.data.materials.append(mat_sphere_secondary)
    towers_col.objects.link(sphere2)
    bpy.context.collection.objects.unlink(sphere2)

    # Spire Needle Tip (رأس السهم الذهبي)
    bpy.ops.mesh.primitive_cone_add(radius1=0.45, radius2=0.02, depth=7.5, vertices=16, location=(0, 0, 27.5))
    spire1 = bpy.context.active_object
    spire1.name = "MainTowerSpire"
    spire1.data.materials.append(mat_gold_spire)
    towers_col.objects.link(spire1)
    bpy.context.collection.objects.unlink(spire1)

    # Second Tower (برج المياه الأوسط - 147 متر)
    bpy.ops.mesh.primitive_cone_add(radius1=2.2, radius2=0.35, depth=20.0, vertices=32, location=(-6.5, 3.5, 10.0))
    t2_col = bpy.context.active_object
    t2_col.name = "SecondTowerColumn"
    t2_col.data.materials.append(mat_concrete)
    towers_col.objects.link(t2_col)
    bpy.context.collection.objects.unlink(t2_col)

    # Second Tower Sphere
    bpy.ops.mesh.primitive_uv_sphere_add(radius=3.1, segments=36, ring_count=20, location=(-6.5, 3.5, 11.0))
    t2_sphere = bpy.context.active_object
    t2_sphere.name = "SecondTowerSphere"
    t2_sphere.data.materials.append(mat_sphere_main)
    towers_col.objects.link(t2_sphere)
    bpy.context.collection.objects.unlink(t2_sphere)

    # Second Tower Spire
    bpy.ops.mesh.primitive_cone_add(radius1=0.35, radius2=0.02, depth=5.5, vertices=16, location=(-6.5, 3.5, 21.0))
    t2_spire = bpy.context.active_object
    t2_spire.name = "SecondTowerSpire"
    t2_spire.data.materials.append(mat_gold_spire)
    towers_col.objects.link(t2_spire)
    bpy.context.collection.objects.unlink(t2_spire)

    # Third Tower (برج الإضاءة الأصغر - 113 متر)
    bpy.ops.mesh.primitive_cone_add(radius1=1.4, radius2=0.15, depth=15.0, vertices=24, location=(-3.2, -6.0, 7.5))
    t3_col = bpy.context.active_object
    t3_col.name = "ThirdTowerColumn"
    t3_col.data.materials.append(mat_concrete)
    towers_col.objects.link(t3_col)
    bpy.context.collection.objects.unlink(t3_col)

    # =========================================================================
    # 4. سفينة البوم الكويتي التراثية المتقنة (Kuwaiti Boom Dhow)
    # =========================================================================
    dhow_col = bpy.data.collections.new("KuwaitiDhow")
    bpy.context.scene.collection.children.link(dhow_col)

    # Hull (هيكل البوم المنحني الأنيق)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(18.0, 14.0, 0.8))
    hull = bpy.context.active_object
    hull.name = "DhowHull"
    hull.scale = (3.5, 14.0, 3.0)
    hull.data.materials.append(mat_teak_wood)
    # Add Subdivision & Bevel for graceful ship curves
    bev = hull.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.35
    bev.segments = 3
    sub = hull.modifiers.new("Subsurf", 'SUBSURF')
    sub.levels = 1
    dhow_col.objects.link(hull)
    bpy.context.collection.objects.unlink(hull)

    # Bowsprit / Stempost (الساطور المائل المميز للبوم الكويتي)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=6.5, location=(18.0, 21.8, 2.8))
    stem = bpy.context.active_object
    stem.name = "DhowStempost"
    stem.rotation_euler = (math.radians(42), 0, 0)
    stem.data.materials.append(mat_teak_wood)
    dhow_col.objects.link(stem)
    bpy.context.collection.objects.unlink(stem)

    # Main Mast (صاري البوم الرئيسي)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=14.0, location=(18.0, 15.0, 8.5))
    mast = bpy.context.active_object
    mast.name = "DhowMainMast"
    mast.rotation_euler = (math.radians(-6), 0, 0) # Traditional raked mast
    mast.data.materials.append(mat_teak_wood)
    dhow_col.objects.link(mast)
    bpy.context.collection.objects.unlink(mast)

    # Lateen Yardarm (فرمن الشراع المائل)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=16.0, location=(18.0, 15.5, 9.5))
    yardarm = bpy.context.active_object
    yardarm.name = "DhowYardarm"
    yardarm.rotation_euler = (math.radians(48), math.radians(12), math.radians(-15))
    yardarm.data.materials.append(mat_teak_wood)
    dhow_col.objects.link(yardarm)
    bpy.context.collection.objects.unlink(yardarm)

    # Lateen Sail (الشراع التراثي المثلث الممتلئ بالرياح)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(18.3, 14.8, 9.2))
    sail = bpy.context.active_object
    sail.name = "DhowLateenSail"
    sail.scale = (0.2, 7.5, 8.5)
    sail.rotation_euler = (math.radians(35), math.radians(8), math.radians(-10))
    sail.data.materials.append(mat_sail_canvas)
    dhow_col.objects.link(sail)
    bpy.context.collection.objects.unlink(sail)

    # =========================================================================
    # 5. بحر الخليج العربي والشاطئ الرملي (Arabian Gulf Ocean & Coast)
    # =========================================================================
    env_col = bpy.data.collections.new("Environment")
    bpy.context.scene.collection.children.link(env_col)

    # Ocean Plane
    bpy.ops.mesh.primitive_plane_add(size=120.0, location=(25.0, 15.0, 0.0))
    sea = bpy.context.active_object
    sea.name = "ArabianGulfWater"
    sea.data.materials.append(mat_sea_water)
    env_col.objects.link(sea)
    bpy.context.collection.objects.unlink(sea)

    # Coastal Sand Terrain (أرض الساحل الرملية)
    bpy.ops.mesh.primitive_plane_add(size=70.0, location=(-15.0, -10.0, 0.15))
    sand = bpy.context.active_object
    sand.name = "CoastalSandTerrain"
    sand.data.materials.append(mat_desert_sand)
    env_col.objects.link(sand)
    bpy.context.collection.objects.unlink(sand)

    # =========================================================================
    # 6. علم الكويت الشامخ ثلاثي الأبعاد (Kuwait Flag)
    # =========================================================================
    # Flagpole
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=11.0, location=(6.0, -5.0, 5.5))
    pole = bpy.context.active_object
    pole.name = "FlagPole"
    pole.data.materials.append(mat_gold_spire)
    env_col.objects.link(pole)
    bpy.context.collection.objects.unlink(pole)

    # Flag Cloth (Green top, White mid, Red bottom)
    for idx, (cmat, yoffset) in enumerate([
        (mat_flag_green, 1.2),
        (mat_flag_white, 0.4),
        (mat_flag_red, -0.4)
    ]):
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=(7.8, -5.0, 9.8 + yoffset * 0.8))
        stripe = bpy.context.active_object
        stripe.name = f"FlagStripe_{idx}"
        stripe.scale = (1.8, 0.05, 0.48)
        stripe.rotation_euler = (0, math.radians(90), 0)
        stripe.data.materials.append(cmat)
        env_col.objects.link(stripe)
        bpy.context.collection.objects.unlink(stripe)

    # Black Trapezoid
    bpy.ops.mesh.primitive_cone_add(radius1=0.9, radius2=0.0, depth=0.8, vertices=3, location=(6.5, -5.0, 10.4))
    trap = bpy.context.active_object
    trap.name = "FlagTrapezoid"
    trap.scale = (1.0, 0.08, 1.3)
    trap.rotation_euler = (0, math.radians(90), math.radians(90))
    trap.data.materials.append(mat_flag_black)
    env_col.objects.link(trap)
    bpy.context.collection.objects.unlink(trap)

    # =========================================================================
    # 7. Cinematic Camera Setup
    # =========================================================================
    cam_data = bpy.data.cameras.new("CinematicCamera")
    cam_data.lens = 32.0 # Wide cinematic lens
    cam_data.dof.use_dof = False
    cam_obj = bpy.data.objects.new("CinematicCamera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (28.0, -22.0, 11.5)
    cam_obj.rotation_euler = (math.radians(72), 0, math.radians(45))

    print("✓ تم بناء المشهد الكويتي الشامل (أبراج الكويت + البوم التراثي + البحر والرمال + علم الكويت) في بلندر بنجاح!")

create_kuwait_masterpiece()
