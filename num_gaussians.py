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

import torch
from scene import Scene
import os
import json
from utils.general_utils import safe_state
from argparse import ArgumentParser
from arguments import ModelParams, PipelineParams, get_combined_args
from gaussian_renderer import GaussianModel

def eval_num_gaussians(dataset : ModelParams, iteration : int):
    with torch.no_grad():
        gaussians = GaussianModel(dataset.sh_degree)
        scene = Scene(dataset, gaussians, load_iteration=iteration, shuffle=False, skip_train=True)

        num_gaussians = scene.gaussians.get_xyz.shape[0]
        with open(os.path.join(dataset.model_path, 'metrics.json'), 'w') as fp:
            json.dump(obj={
                "num_gaussians": num_gaussians,
            }, fp=fp, indent=2)
        return
        
if __name__ == "__main__":
    # Set up command line argument parser
    parser = ArgumentParser(description="Testing script parameters")
    model = ModelParams(parser, sentinel=True)
    pipeline = PipelineParams(parser)
    parser.add_argument("--iteration", default=-1, type=int)
    parser.add_argument("--skip_train", action="store_true")
    parser.add_argument("--skip_test", action="store_true")
    parser.add_argument("--quiet", action="store_true")
    args = get_combined_args(parser)
    print("Evaluating Num Gaussians for " + args.model_path)

    # Initialize system state (RNG)
    safe_state(args.quiet)

    eval_num_gaussians(model.extract(args), args.iteration)