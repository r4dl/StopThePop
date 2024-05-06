#
# Copyright (C) 2023, Inria
# GRAPHDECO research group, https://team.inria.fr/graphdeco
# All rights reserved.
#
# This software is free for non-commercial, research and evaluation use 
# under the terms of the LICENSE.md file.
#
# For inquiries contact  george.drettakis@inria.fr
#

import os
from argparse import ArgumentParser

mipnerf360_outdoor_scenes = ["bicycle", "flowers", "garden", "stump", "treehill"]
mipnerf360_indoor_scenes = ["room", "counter", "kitchen", "bonsai"]
tanks_and_temples_scenes = ["truck", "train"]
deep_blending_scenes = ["drjohnson", "playroom"]

parser = ArgumentParser(description="Full evaluation script parameters")
parser.add_argument("--skip_training", action="store_true")
parser.add_argument("--skip_rendering", action="store_true")
parser.add_argument("--skip_metrics", action="store_true")
parser.add_argument("--skip_num_gaussians", action="store_true")
parser.add_argument("--output_path", default="./eval")
args, _ = parser.parse_known_args()

all_scenes = []
all_scenes.extend(mipnerf360_outdoor_scenes)
all_scenes.extend(mipnerf360_indoor_scenes)
all_scenes.extend(tanks_and_temples_scenes)
all_scenes.extend(deep_blending_scenes)

if not args.skip_training or not args.skip_rendering:
    parser.add_argument('--mipnerf360', "-m360", required=True, type=str)
    parser.add_argument("--tanksandtemples", "-tat", required=True, type=str)
    parser.add_argument("--deepblending", "-db", required=True, type=str)
    
    # additional cl-args for our method
    parser.add_argument("--sorted", action="store_true")
    parser.add_argument("--per_tile_depth", action="store_true")
    parser.add_argument("--sort_window", type=int, default=1)
    parser.add_argument("--opacity_decay", type=float, default=0)
    args = parser.parse_args()

# create a unique name and arguments
name_args = ''
custom_args = ' '
if args.sorted:
    name_args += '_sorted'
    custom_args += '--sorted '
    if args.per_tile_depth:
        name_args += '_ptdepth'
        custom_args += '--per_tile_depth '
    name_args += f'_{args.sort_window}'
    custom_args += f'--sort_window {args.sort_window}'
    if args.opacity_decay > 0:
        name_args += f'_decay_{args.opacity_decay}'
        custom_args += f'--opacity_decay {args.opacity_decay}'

if not args.skip_training:
    common_args = " --quiet --eval --test_iterations -1" + custom_args
    for scene in mipnerf360_outdoor_scenes:
        source = args.mipnerf360 + "/" + scene
        os.system("python train.py -s " + source + " -i images_4 -m " + args.output_path + "/" + scene + name_args + common_args)
    for scene in mipnerf360_indoor_scenes:
        source = args.mipnerf360 + "/" + scene
        os.system("python train.py -s " + source + " -i images_2 -m " + args.output_path + "/" + scene + name_args + common_args)
    for scene in tanks_and_temples_scenes:
        source = args.tanksandtemples + "/" + scene
        os.system("python train.py -s " + source + " -m " + args.output_path + "/" + scene + name_args + common_args)
    for scene in deep_blending_scenes:
        source = args.deepblending + "/" + scene
        os.system("python train.py -s " + source + " -m " + args.output_path + "/" + scene + name_args + common_args)

if not args.skip_rendering:
    all_sources = []
    for scene in mipnerf360_outdoor_scenes:
        all_sources.append(args.mipnerf360 + "/" + scene)
    for scene in mipnerf360_indoor_scenes:
        all_sources.append(args.mipnerf360 + "/" + scene)
    for scene in tanks_and_temples_scenes:
        all_sources.append(args.tanksandtemples + "/" + scene)
    for scene in deep_blending_scenes:
        all_sources.append(args.deepblending + "/" + scene)

    common_args = " --quiet --eval --skip_train" + custom_args
    for scene, source in zip(all_scenes, all_sources):
        for it in [7000, 30000]:
            os.system(f"python render.py --iteration {it} -s " + source + " -m " + args.output_path + "/" + scene + name_args + common_args)

if not args.skip_metrics:
    for scene in all_scenes:
        scenes_string = "\"" + args.output_path + "/" + scene

        os.system("python metrics.py -m " + scenes_string + name_args)

# evaluate the number of gaussians for each model
if not args.skip_num_gaussians:
    for scene in all_scenes:
        scenes_string = "\"" + args.output_path + "/" + scene

        os.system("python num_gaussians.py -m " + scenes_string + name_args)