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
    parser.add_argument('--config', required=True, type=str)
    parser.add_argument("--opacity_decay", type=float, default=0)
    args = parser.parse_args()

if not args.skip_training:
    common_args = f"--splatting_config=\"{args.config}\" --quiet --eval --test_iterations -1"
    if args.opacity_decay > 0:
        common_args += f' --opacity_decay={args.opacity_decay} ' 
    for scene in mipnerf360_outdoor_scenes:
        source = args.mipnerf360 + "/" + scene
        os.system(f"python train.py -s {source} -i images_4 -m {args.output_path}/{scene} {common_args}")
    for scene in mipnerf360_indoor_scenes:
        source = args.mipnerf360 + "/" + scene
        os.system(f"python train.py -s {source} -i images_2 -m {args.output_path}/{scene} {common_args}")
    for scene in tanks_and_temples_scenes:
        source = args.tanksandtemples + "/" + scene
        os.system(f"python train.py -s {source} -m {args.output_path}/{scene} {common_args}")
    for scene in deep_blending_scenes:
        source = args.deepblending + "/" + scene
        os.system(f"python train.py -s {source} -m {args.output_path}/{scene} {common_args}")

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

    common_args = " --quiet --eval --skip_train"
    for scene, source in zip(all_scenes, all_sources):
        for it in [7000, 30000]:
            os.system(f"python render.py --iteration {it} -s {source} -m {args.output_path}/{scene} {common_args}")

if not args.skip_metrics:
    for scene in all_scenes:
        scenes_string = "\"" + args.output_path + "/" + scene + "\""

        os.system("python metrics.py -m " + scenes_string)