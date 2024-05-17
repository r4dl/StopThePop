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

from argparse import ArgumentParser, Namespace
from diff_gaussian_rasterization import ExtendedSettings, GlobalSortOrder, SortMode, CullingSettings, SortSettings, SortQueueSizes
import json
import sys
import os
from typing import Any, Dict, Type
from typing_inspect import get_args, get_generic_bases, is_generic_type, is_union_type

class GroupParams:
    pass

class ParamGroup:
    def __init__(self, parser: ArgumentParser, name : str, fill_none = False):
        group = parser.add_argument_group(name)
        for key, value in vars(self).items():
            shorthand = False
            if key.startswith("_"):
                shorthand = True
                key = key[1:]
            t = type(value)
            value = value if not fill_none else None 
            if shorthand:
                if t == bool:
                    group.add_argument("--" + key, ("-" + key[0:1]), default=value, action="store_true")
                else:
                    group.add_argument("--" + key, ("-" + key[0:1]), default=value, type=t)
            else:
                if t == bool:
                    group.add_argument("--" + key, default=value, action="store_true")
                else:
                    group.add_argument("--" + key, default=value, type=t)

    def extract(self, args):
        group = GroupParams()
        for arg in vars(args).items():
            if arg[0] in vars(self) or ("_" + arg[0]) in vars(self):
                setattr(group, arg[0], arg[1])
        return group

class ModelParams(ParamGroup): 
    def __init__(self, parser, sentinel=False):
        self.sh_degree = 3
        self._source_path = ""
        self._model_path = ""
        self._images = "images"
        self._resolution = -1
        self._white_background = False
        self.data_device = "cuda"
        self.eval = False
        super().__init__(parser, "Loading Parameters", sentinel)

    def extract(self, args):
        g = super().extract(args)
        g.source_path = os.path.abspath(g.source_path)
        return g

class PipelineParams(ParamGroup):
    def __init__(self, parser):
        self.convert_SHs_python = False
        self.compute_cov3D_python = False
        self.debug = False
        super().__init__(parser, "Pipeline Parameters")

Json = Dict[str, Any]
def json_decoder(nt: ExtendedSettings, data: Dict[str, Any]) -> Dict:
    decoded = {}
    field_types = nt._field_types
    for key in field_types:
        value = data.get(key)
        if value is None:
            possible_types = get_args(field_types[key])
            if len(possible_types) < 2 or type(None) not in possible_types:  # confirm the field is optional
                raise ValueError(
                    "Error decoding Json for {nt}. key '{key}' was 'None' but not listed as optional field.".format(
                        nt=nt, key=key))
        else:
            field_type = field_types[key]
            if is_generic_type(field_type):
                field_type = get_generic_bases(field_type)[0]
            elif is_union_type(field_type):
                field_type = get_args(field_types[key])[0]
            value = field_type(value)
        decoded[key] = value
    return decoded

class SplattingSettings():
    
    group_config = None
    group_settings = None
    settings = ExtendedSettings()
    parser = None
    render = False
    
    def __init__(self, parser, render=False):
        self.parser = parser
        self.render = render
        if not render:
            self.group_config = parser.add_argument_group("Splatting Config")
            self.group_config.add_argument("--splatting_config", type=str)
        
        self.group_settings = parser.add_argument_group("Splatting Settings")
        self.group_settings.add_argument("--sort_mode", type=lambda sortmode: SortMode[sortmode], choices=list(SortMode))
        self.group_settings.add_argument("--sort_order", type=lambda sortorder: GlobalSortOrder[sortorder], choices=list(GlobalSortOrder))
        self.group_settings.add_argument("--tile_4x4", type=int, choices=[64], help='only needed if using SortMode.HIER')
        self.group_settings.add_argument("--tile_2x2", type=int, choices=[8,12,20], help='only needed if using SortMode.HIER')
        self.group_settings.add_argument("--per_pixel", type=int, choices=[1,2,4,8,12,16,20,24], help='if using SortMode.HIER, only {4,8,12,16} are valid')
        self.group_settings.add_argument("--rect_bounding", type=bool, choices=[True, False])
        self.group_settings.add_argument("--tight_opacity_bounding", type=bool, choices=[True, False])
        self.group_settings.add_argument("--tile_based_culling", type=bool, choices=[True, False])
        self.group_settings.add_argument("--hierarchical_4x4_culling", type=bool, choices=[True, False])
        self.group_settings.add_argument("--load_balancing", type=bool, choices=[True, False])
        self.group_settings.add_argument("--proper_ewa_scaling", type=bool, choices=[True, False])
    
    def get_settings(self, arguments):
        # get valid choices from configargparse
        config = None
        
        # load default dict, if passed
        if self.render:
            cmdlne_string = sys.argv[1:]
            args_cmdline = self.parser.parse_args(cmdlne_string)
            cfgfilepath = os.path.join(args_cmdline.model_path, "config.json")
            print("Looking for splatting config file in", cfgfilepath)
            if os.path.exists(cfgfilepath):
                print("Config file found: {}".format(cfgfilepath))
                self.settings = ExtendedSettings.from_json(cfgfilepath)
            else:
                print("No config file found, assuming default values")
        else:
            for arg in vars(arguments).items():
                if any([arg[0] in z.option_strings[0] for z in self.group_config._group_actions]):
                    # json passed, load it
                    with open(arg[1], 'r') as json_file:
                        config = json.load(json_file)[0]
                        self.settings = ExtendedSettings.from_dict(config)
                    
        for arg in vars(arguments).items():
            if any([arg[0] in z.option_strings[0] for z in self.group_settings._group_actions]):
                # pass any options which were not given
                if arg[1] is None:
                    continue
                self.settings.set_value(arg[0], arg[1])
                
        return self.settings

class OptimizationParams(ParamGroup):
    def __init__(self, parser):
        self.iterations = 30_000
        self.position_lr_init = 0.00016
        self.position_lr_final = 0.0000016
        self.position_lr_delay_mult = 0.01
        self.position_lr_max_steps = 30_000
        self.feature_lr = 0.0025
        self.opacity_lr = 0.05
        self.scaling_lr = 0.005
        self.rotation_lr = 0.001
        self.percent_dense = 0.01
        self.lambda_dssim = 0.2
        self.densification_interval = 100
        self.opacity_reset_interval = 3000
        self.densify_from_iter = 500
        self.densify_until_iter = 15_000
        self.densify_grad_threshold = 0.0002
        self.random_background = False
        super().__init__(parser, "Optimization Parameters")

def get_combined_args(parser : ArgumentParser):
    cmdlne_string = sys.argv[1:]
    cfgfile_string = "Namespace()"
    args_cmdline = parser.parse_args(cmdlne_string)

    try:
        cfgfilepath = os.path.join(args_cmdline.model_path, "cfg_args")
        print("Looking for config file in", cfgfilepath)
        with open(cfgfilepath) as cfg_file:
            print("Config file found: {}".format(cfgfilepath))
            cfgfile_string = cfg_file.read()
    except TypeError:
        print("Config file not found at")
        pass
    args_cfgfile = eval(cfgfile_string)

    merged_dict = vars(args_cfgfile).copy()
    for k,v in vars(args_cmdline).items():
        if v != None:
            merged_dict[k] = v
    return Namespace(**merged_dict)
