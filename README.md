# StopThePop
## Sorted Gaussian Splatting for View-Consistent Real-time Rendering
[Lukas Radl](https://r4dl.github.io/)<sup>&#42;</sup>, 
[Michael Steiner](https://scholar.google.com/citations?hl=de&user=Pbtgcz8AAAAJ)<sup>&#42;</sup>,
[Mathias Parger](https://dabeschte.github.io/), 
[Alexander Weinrauch](https://scholar.google.com/citations?user=pkqf2mgAAAAJ&hl=de&oi=ao), 
[Bernhard Kerbl](https://snosixtyboo.github.io/), 
[Markus Steinberger](https://www.markussteinberger.net/)
<br> 
<sup>&#42;</sup> denotes equal contribution
<br>
| [Webpage](https://r4dl.github.io/StopThePop) 
| [Full Paper](https://arxiv.org/abs/2402.00525) 
| [Video](https://youtu.be/EmcXtHYhigk) 
| [T&T+DB COLMAP (650MB)](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/datasets/input/tandt_db.zip) 
<!-- | [Pre-trained Models (14 GB)](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/datasets/pretrained/models.zip)  -->
<br>
<!-- TODO: add a gif as teaser, this does not look nice  -->

![Teaser image](assets/teaser.gif)

This repository contains the official authors implementation associated with the paper "StopThePop: Sorted Gaussian Splatting for View-Consistent Real-time Rendering", which can be found [here](https://r4dl.github.io/StopThePop). 
<!-- We further provide the reference images used to create the error metrics reported in the paper, as well as recently created, pre-trained models.  -->

<a href="https://www.inria.fr/"><img height="100" src="assets/tugraz-logo.jpg"> </a>
<a href="https://univ-cotedazur.eu/"><img height="100" src="assets/huawei-logo.jpg"> </a>
<a href="https://www.mpi-inf.mpg.de"><img height="100" src="assets/tuwien_logo.jpg"> </a>

Abstract: *Gaussian Splatting has emerged as a prominent model for constructing 3D representations from images across diverse domains. However, the efficiency of the 3D Gaussian Splatting rendering pipeline relies on several simplifications. Notably, reducing Gaussian to 2D splats with a single view-space depth introduces popping and blending artifacts during view rotation. Addressing this issue requires accurate per-pixel depth computation, yet a full per-pixel sort proves excessively costly compared to a global sort operation. In this paper, we present a novel hierarchical rasterization approach that systematically resorts and culls splats with minimal processing overhead. Our software rasterizer <b>effectively eliminates popping artifacts and view inconsistencies</b>, as demonstrated through both quantitative and qualitative measurements. Simultaneously, our method mitigates the potential for cheating view-dependent effects with popping, ensuring a more authentic representation. Despite the elimination of cheating, our approach achieves comparable quantitative results for test images, while increasing the consistency for novel view synthesis in motion. Due to its design, our hierarchical approach is <b>only 4% slower</b> on average than the original Gaussian Splatting. Notably, enforcing consistency enables a reduction in the number of Gaussians by approximately half with nearly identical quality and view-consistency. Consequently, rendering performance is nearly doubled, making our approach 1.6x faster than the original Gaussian Splatting, with a 50% reduction in memory requirements.*


<section class="section" id="BibTeX">
  <div class="container is-max-desktop content">
    <h2 class="title">BibTeX</h2>
    <pre><code>@article{radl2024stopthepop,
  author    = {Radl, Lukas and Steiner, Michael and Parger, Mathias and Weinrauch, Alexander and Kerbl, Bernhard and Steinberger, Markus},
  title     = {{StopThePop: Sorted Gaussian Splatting for View-Consistent Real-time Rendering}},
  journal   = {ACM Transactions on Graphics},
  number    = {4},
  volume    = {43},
  articleno = {64},
  year      = {2024},
}</code></pre>
  </div>
</section>

## Overview
Our repository is built on [3D Gaussian Splatting](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/):
For a full breakdown on how to get the code running, please consider [3DGS's Readme](https://github.com/graphdeco-inria/gaussian-splatting/blob/main/README.md).

The project is split into submodules, each maintained in a separate github repository:

* [StopThePop-Rasterization](https://github.com/r4dl/StopThePop-Rasterization): A clone of the original [diff-gaussian-rasterization](https://github.com/graphdeco-inria/diff-gaussian-rasterization) that contains our CUDA hierarchical rasterizer implementation
* [SIBR_StopThePop](https://github.com/r4dl/SIBR_StopThePop): A clone of the [SIBR Core](https://gitlab.inria.fr/sibr/sibr_core) project, containing an adapted viewer with our additional settings and functionalities
* [PoppingDetection](https://github.com/r4dl/PoppingDetection): Self-contained module for our proposed popping detection metric


## Cloning the Repository

The repository contains submodules, thus please check it out with 
```shell
# HTTPS
git clone https://github.com/r4dl/StopThePop --recursive
```

## Setup

### Local Setup

Our default, provided install method is based on Conda package and environment management:
```shell
SET DISTUTILS_USE_SDK=1 # Windows only
conda env create --file environment.yml
conda activate stopthepop
```
This process assumes that you have CUDA SDK **11** installed, not **12**.

### Running

The implementation includes 4 flavors of Gaussian Splatting:
<ul>
  <li>Ours: <strong>Hierarchically Sorted Rasterizer</strong> (recommended)</li>
  <li>Ours: Per-pixel Approximate Sort (k-Buffer)</li>
  <li>Ours: Per-pixel Full Sort (only forward pass supported; no optimization) </li>
  <li>Vanilla 3DGS</li>
</ul>

The `train.py` script takes a `.json` config file as the argument `--splatting_config`, which should contain the following information (this example is also the default `config.json`, if none is provided):

```cpp
{
  "sort_settings": 
  {
    "sort_mode": 0,      // Global (0), Per-Pixel Full (1), Per-Pixel K-Buffer (2), Hierarchical(3)
    "sort_order": 0,     /* Viewspace Z-Depth (0), Worldspace Distance (1), 
                            Per-Tile Depth at Tile Center (2), Per-Tile Depth at Max Contrib. Pos. (3) */
    "queue_sizes": 
    {
      "per_pixel": 4,  // Used for: Per-Pixel K-Buffer and Hierarchical
      "tile_2x2": 8,   // Used only for Hierarchical
      "tile_4x4": 64   // Used only for Hierarchical
    }
  },
  "culling_settings": 
  {
    "rect_bounding": false,            // Bound Gaussians with a rectangle (instead fo square)
    "tight_opacity_bounding": false,   // Bound Gaussians by considering their opacity value
    "tile_based_culling": false,       /* Reject Tiles where Max Contribution is below thershold;
                                            Recommended to be used together with Load Balancing*/
    "hierarchical_4x4_culling": false, // Used only for Hierarchical
  },
  "load_balancing": false,      // Use load balancing for per-tile calculations (culling and depth) and duplication
  "proper_ewa_scaling": false,  /* Proper dilation of opacity, as proposed by Yu et al. ("Mip-Splatting");
                                    Model also needs to be trained with this setting */
}
```
These values can be overwritten through the command line. 
Call `python train.py --help` to see all available options.
At the start of training, the provided arguments will be written into the output directory.
The `render.py` script uses the `config.json` in the model directory per default, with the option to overwrite through the command line.

To train different example models (see the corresponding config files for the used settings), run:

```shell
# Our Hierarchical Rasterizer, as proposed in StopThePop
python train.py --splatting_config configs/hierarchical.json -s <path to COLMAP or NeRF Synthetic dataset>
# Vanilla 3DGS
python train.py --splatting_config config/vanilla.json -s <path to COLMAP or NeRF Synthetic dataset>
# Per-Pixel K-Buffer Sort (Queue Size 16)
python train.py --splatting_config config/kbuffer.json -s <path to COLMAP or NeRF Synthetic dataset>
```

<details>
<summary><span style="font-weight: bold;">Additional New Command Line Arguments for train.py</span></summary>

  #### --opacity_decay
  Train with Opacity Decay - this results in comparable image metrics with significantly fewer Gaussians. We used  ```--opacity_decay 0.9995``` for the reported results in our paper.
</details>
<details>
  <summary><span style="font-weight: bold; opacity: 50%;">Original Command Line Arguments for train.py</span></summary>

  #### --source_path / -s
  Path to the source directory containing a COLMAP or Synthetic NeRF data set.
  #### --model_path / -m 
  Path where the trained model should be stored (```output/<random>``` by default).
  #### --images / -i
  Alternative subdirectory for COLMAP images (```images``` by default).
  #### --eval
  Add this flag to use a MipNeRF360-style training/test split for evaluation.
  #### --resolution / -r
  Specifies resolution of the loaded images before training. If provided ```1, 2, 4``` or ```8```, uses original, 1/2, 1/4 or 1/8 resolution, respectively. For all other values, rescales the width to the given number while maintaining image aspect. **If not set and input image width exceeds 1.6K pixels, inputs are automatically rescaled to this target.**
  #### --data_device
  Specifies where to put the source image data, ```cuda``` by default, recommended to use ```cpu``` if training on large/high-resolution dataset, will reduce VRAM consumption, but slightly slow down training. Thanks to [HrsPythonix](https://github.com/HrsPythonix).
  #### --white_background / -w
  Add this flag to use white background instead of black (default), e.g., for evaluation of NeRF Synthetic dataset.
  #### --sh_degree
  Order of spherical harmonics to be used (no larger than 3). ```3``` by default.
  #### --convert_SHs_python
  Flag to make pipeline compute forward and backward of SHs with PyTorch instead of ours.
  #### --compute_cov3D_python
  Flag to make pipeline compute forward and backward of the 3D covariance with PyTorch instead of ours.
  #### --debug
  Enables debug mode if you experience erros. If the rasterizer fails, a ```dump``` file is created that you may forward to us in an issue so we can take a look.
  #### --debug_from
  Debugging is **slow**. You may specify an iteration (starting from 0) after which the above debugging becomes active.
  #### --iterations
  Number of total iterations to train for, ```30_000``` by default.
  #### --ip
  IP to start GUI server on, ```127.0.0.1``` by default.
  #### --port 
  Port to use for GUI server, ```6009``` by default.
  #### --test_iterations
  Space-separated iterations at which the training script computes L1 and PSNR over test set, ```7000 30000``` by default.
  #### --save_iterations
  Space-separated iterations at which the training script saves the Gaussian model, ```7000 30000 <iterations>``` by default.
  #### --checkpoint_iterations
  Space-separated iterations at which to store a checkpoint for continuing later, saved in the model directory.
  #### --start_checkpoint
  Path to a saved checkpoint to continue training from.
  #### --quiet 
  Flag to omit any text written to standard out pipe. 
  #### --feature_lr
  Spherical harmonics features learning rate, ```0.0025``` by default.
  #### --opacity_lr
  Opacity learning rate, ```0.05``` by default.
  #### --scaling_lr
  Scaling learning rate, ```0.005``` by default.
  #### --rotation_lr
  Rotation learning rate, ```0.001``` by default.
  #### --position_lr_max_steps
  Number of steps (from 0) where position learning rate goes from ```initial``` to ```final```. ```30_000``` by default.
  #### --position_lr_init
  Initial 3D position learning rate, ```0.00016``` by default.
  #### --position_lr_final
  Final 3D position learning rate, ```0.0000016``` by default.
  #### --position_lr_delay_mult
  Position learning rate multiplier (cf. Plenoxels), ```0.01``` by default. 
  #### --densify_from_iter
  Iteration where densification starts, ```500``` by default. 
  #### --densify_until_iter
  Iteration where densification stops, ```15_000``` by default.
  #### --densify_grad_threshold
  Limit that decides if points should be densified based on 2D position gradient, ```0.0002``` by default.
  #### --densification_interval
  How frequently to densify, ```100``` (every 100 iterations) by default.
  #### --opacity_reset_interval
  How frequently to reset opacity, ```3_000``` by default. 
  #### --lambda_dssim
  Influence of SSIM on total loss from 0 to 1, ```0.2``` by default. 
  #### --percent_dense
  Percentage of scene extent (0--1) a point must exceed to be forcibly densified, ```0.01``` by default.
  </details>
<br>

### Evaluation

By default, the trained models use all available images in the dataset. 
To train them while withholding a test set for evaluation, use the ```--eval``` flag. 
This way, you can render training/test sets and produce error metrics as follows:

```shell
python train.py -s <path to COLMAP or NeRF Synthetic dataset> --eval # Train with train/test split
python render.py -m <path to trained model> # Generate renderings
python metrics.py -m <path to trained model> # Compute error metrics on renderings
python num_gaussians.py -m <path to trained model> # Output the number of Gaussians
```

<details>
<summary><span style="font-weight: bold; opacity: 50%;">Original Command Line Arguments for render.py</span></summary>

  #### --model_path / -m 
  Path to the trained model directory you want to create renderings for.
  #### --skip_train
  Flag to skip rendering the training set.
  #### --skip_test
  Flag to skip rendering the test set.
  #### --quiet 
  Flag to omit any text written to standard out pipe. 

  **The below parameters will be read automatically from the model path, based on what was used for training. However, you may override them by providing them explicitly on the command line.** 

  #### --source_path / -s
  Path to the source directory containing a COLMAP or Synthetic NeRF data set.
  #### --images / -i
  Alternative subdirectory for COLMAP images (```images``` by default).
  #### --eval
  Add this flag to use a MipNeRF360-style training/test split for evaluation.
  #### --resolution / -r
  Changes the resolution of the loaded images before training. If provided ```1, 2, 4``` or ```8```, uses original, 1/2, 1/4 or 1/8 resolution, respectively. For all other values, rescales the width to the given number while maintaining image aspect. ```1``` by default.
  #### --white_background / -w
  Add this flag to use white background instead of black (default), e.g., for evaluation of NeRF Synthetic dataset.
  #### --convert_SHs_python
  Flag to make pipeline render with computed SHs from PyTorch instead of ours.
  #### --compute_cov3D_python
  Flag to make pipeline render with computed 3D covariance from PyTorch instead of ours.
</details>

<details>
<summary><span style="font-weight: bold; opacity: 50%;">Original Command Line Arguments for metrics.py</span></summary>

  #### --model_paths / -m 
  Space-separated list of model paths for which metrics should be computed.
</details>
<br>

We further provide the ```full_eval.py``` script.
This script specifies the routine used in our evaluation and demonstrates the use of some additional parameters, e.g., ```--images (-i)``` to define alternative image directories within COLMAP data sets.
If you have downloaded and extracted all the training data, you can run it like this:

```shell
python full_eval.py -m360 <mipnerf360 folder> -tat <tanks and temples folder> -db <deep blending folder> -config <splatting config file>
```

<details>
<summary><span style="font-weight: bold;">New Command Line Arguments for full_eval.py</span></summary>
  
  #### --sorted
  Add this flag to use our sorted Gaussian Splatting implementation.
  #### --per_tile_depth
  Add this flag to enable per-tile depth computations.
  #### --sort_window
  Specifies the size of the sort window. If ```> 24```, we use our hierarchical renderer.
  #### --opacity_decay
  Train with Opacity Decay - this results in comparable image metrics with significantly fewer Gaussians. We used  ```--opacity_decay 0.9995``` for the reported results in our paper.
  #### --skip_num_gaussians
  Do not output the number of Gaussians.
</details>
<details>
<summary><span style="font-weight: bold; opacity: 50%;">Original Command Line Arguments for full_eval.py</span></summary>
  
  #### --skip_training
  Flag to skip training stage.
  #### --skip_rendering
  Flag to skip rendering stage.
  #### --skip_metrics
  Flag to skip metrics calculation stage.
  #### --output_path
  Directory to put renderings and results in, ```./eval``` by default, set to pre-trained model location if evaluating them.
  #### --mipnerf360 / -m360
  Path to MipNeRF360 source datasets, required if training or rendering.
  #### --tanksandtemples / -tat
  Path to Tanks&Temples source datasets, required if training or rendering.
  #### --deepblending / -db
  Path to Deep Blending source datasets, required if training or rendering.
</details>
<br>

### FAQ
Please consider 3DGS's FAQ, contained in [their README](https://github.com/graphdeco-inria/gaussian-splatting/blob/main/README.md). In addition, several issues are also covered on [3DGS's issues page](https://github.com/graphdeco-inria/gaussian-splatting/issues).

## Interactive Viewers
Following 3DGS, we provide interactive viewers for our method: remote and real-time. 
Our viewing solutions are based on the [SIBR](https://sibr.gitlabpages.inria.fr/) framework, developed by the GRAPHDECO group for several novel-view synthesis projects.
Our modified viewer contains additional debug modes, and options to disable several of our proposed optmizations.
The implementation is hosted [here](https://github.com/r4dl/SIBR_StopThePop).
Hardware requirements and setup steps are identical to 3DGS, hence, refer to the [corresponding README](https://github.com/graphdeco-inria/gaussian-splatting/blob/main/README.md) for details.

<section class="section" id="BibTeX">
  <div class="container is-max-desktop content">
    <h3 class="title">BibTeX</h2>
    <pre><code>@misc{sibr2020,
   author       = {Bonopera, Sebastien and Esnault, Jerome and Prakash, Siddhant and Rodriguez, Simon and Thonat, Theo and Benadel, Mehdi and Chaurasia, Gaurav and Philip, Julien and Drettakis, George},
   title        = {sibr: A System for Image Based Rendering},
   year         = {2020},
   url          = {https://gitlab.inria.fr/sibr/sibr_core}
}</code></pre>
  </div>
</section>

### Modifications

todo
<br>

## Popping Detection
Our popping detection method is a self-contained module, hosted [here](https://github.com/r4dl/PoppingDetection), and included as a submodule.
For more information on how to run the method, consult the [submodules README](popping_detection/README.md).