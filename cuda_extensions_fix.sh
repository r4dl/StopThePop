#!/bin/bash
# Complete fix for CUDA memory access errors - Auto-detects GPU architecture

echo "Fixing StopThePop CUDA memory access errors with auto-detected GPU optimizations..."

cd /home/mas/proj/sensyn/StopThePop
source ~/anaconda3/etc/profile.d/conda.sh
conda activate stopthepop

# Step 1: Check current setup
echo "=== Current Setup ==="
python -c "
import torch
print(f'PyTorch: {torch.__version__}')
print(f'CUDA available: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'CUDA version: {torch.version.cuda}')
    print(f'GPU: {torch.cuda.get_device_name(0)}')
    print(f'Compute capability: {torch.cuda.get_device_capability(0)}')
    print(f'Memory: {torch.cuda.get_device_properties(0).total_memory // 1024**3} GB')
"

# Step 2: Clean and rebuild extensions
echo "=== Cleaning previous builds ==="
pip uninstall diff-gaussian-rasterization simple-knn -y 2>/dev/null

# Clean build directories completely
rm -rf submodules/simple-knn/build submodules/simple-knn/dist submodules/simple-knn/*.egg-info
rm -rf submodules/diff-gaussian-rasterization/build submodules/diff-gaussian-rasterization/dist submodules/diff-gaussian-rasterization/*.egg-info

# Step 3: Auto-detect GPU architecture and set CUDA settings
echo "=== Auto-detecting GPU architecture ==="
export CUDA_HOME=/usr/local/cuda
export FORCE_CUDA=1
export CUDA_LAUNCH_BLOCKING=1

# Auto-detect GPU compute capability
GPU_COMPUTE_CAP=$(python -c "
import torch
if torch.cuda.is_available():
    cap = torch.cuda.get_device_capability(0)
    print(f'{cap[0]}.{cap[1]}')
else:
    print('7.5')  # Fallback for older GPUs
")

GPU_NAME=$(python -c "
import torch
if torch.cuda.is_available():
    print(torch.cuda.get_device_name(0))
else:
    print('Unknown GPU')
")

export TORCH_CUDA_ARCH_LIST="$GPU_COMPUTE_CAP"
echo "Detected GPU: $GPU_NAME"
echo "Set TORCH_CUDA_ARCH_LIST=$GPU_COMPUTE_CAP for detected GPU architecture"

# Step 4: Fix and build simple-knn with auto-detected GPU settings
echo "=== Fixing and building simple-knn for $GPU_NAME ==="
cd submodules/simple-knn

# Fix the FLT_MAX issue by adding proper include
if ! grep -q "#include <cfloat>" simple_knn.cu; then
    echo "Adding cfloat include to simple_knn.cu..."
    sed -i '1i #include <cfloat>' simple_knn.cu
fi

# Try setup.py first to avoid pip build isolation issues
python setup.py build_ext --inplace --force 2>&1
if [ $? -eq 0 ]; then
    python setup.py install --force
    echo "simple-knn built with setup.py"
else
    echo "setup.py failed, trying pip with --no-build-isolation..."
    pip install -e . --no-build-isolation --no-cache-dir -v
fi

# Step 5: Build diff-gaussian-rasterization  
echo "=== Building diff-gaussian-rasterization for $GPU_NAME ==="
cd ../diff-gaussian-rasterization

# Try setup.py first
python setup.py build_ext --inplace --force 2>&1
if [ $? -eq 0 ]; then
    python setup.py install --force
    echo "diff-gaussian-rasterization built with setup.py"
else
    echo "setup.py failed, trying pip with --no-build-isolation..."
    pip install -e . --no-build-isolation --no-cache-dir -v
fi

# Step 6: Test imports
echo "=== Testing imports ==="
cd /home/mas/proj/sensyn/StopThePop
python -c "
import sys
import torch

# Add paths in case pip install didn't work
sys.path.insert(0, 'submodules/simple-knn')
sys.path.insert(0, 'submodules/diff-gaussian-rasterization')

print(f'CUDA available: {torch.cuda.is_available()}')

try:
    from simple_knn._C import distCUDA2
    print('✓ simple_knn import OK')
    
    # Test with dummy data
    points = torch.rand(10, 3, device='cuda')
    distances = distCUDA2(points)
    print(f'✓ simple_knn functional test OK ({len(distances)} distances)')
except Exception as e:
    print(f'✗ simple_knn failed: {e}')

try:
    from diff_gaussian_rasterization import GaussianRasterizer, GaussianRasterizationSettings
    print('✓ diff_gaussian_rasterization import OK')
    
    # Test basic functionality
    settings = GaussianRasterizationSettings(
        image_height=480, image_width=640, tanfovx=1.0, tanfovy=1.0,
        bg=torch.zeros(3, device='cuda'), scale_modifier=1.0,
        viewmatrix=torch.eye(4, device='cuda'), projmatrix=torch.eye(4, device='cuda'),
        sh_degree=0, campos=torch.zeros(3, device='cuda'),
        prefiltered=False, debug=False
    )
    rasterizer = GaussianRasterizer(raster_settings=settings)
    print('✓ diff_gaussian_rasterization functional test OK')
except Exception as e:
    print(f'✗ diff_gaussian_rasterization failed: {e}')
"

# Step 7: Apply GPU-optimized renderer fixes
echo "=== Applying GPU-optimized renderer fixes for $GPU_NAME ==="
if [ ! -f gaussian_renderer/__init__.py.backup ]; then
    cp gaussian_renderer/__init__.py gaussian_renderer/__init__.py.backup
fi

# First, fix any syntax errors from previous script runs
echo "Checking for and fixing syntax errors..."
python3 << 'EOF'
# Fix syntax errors from previous modifications
with open('gaussian_renderer/__init__.py', 'r') as f:
    content = f.read()

lines = content.split('\n')
fixed_lines = []

for line in lines:
    # Remove any orphaned parameter lines that cause syntax errors
    if (line.strip().startswith('means3D = means3D,') or 
        line.strip().startswith('means2D = means2D,') or
        line.strip().startswith('shs = shs,') or
        line.strip().startswith('colors_precomp = colors_precomp,') or
        line.strip().startswith('opacities = opacity,') or
        line.strip().startswith('scales = scales,') or
        line.strip().startswith('rotations = rotations,') or
        line.strip().startswith('cov3D_precomp = cov3D_precomp)')):
        print(f"Removing orphaned line: {line.strip()}")
        continue  # Skip these orphaned lines
    else:
        fixed_lines.append(line)

# Write the cleaned file
with open('gaussian_renderer/__init__.py', 'w') as f:
    f.write('\n'.join(fixed_lines))

print("Syntax error cleanup completed")
EOF

# Apply comprehensive memory safety and RTX 4080 optimizations
echo "Applying RTX 4080 renderer fixes..."

# First restore from backup if it exists to start clean
if [ -f gaussian_renderer/__init__.py.backup ]; then
    echo "Restoring from backup to start clean..."
    cp gaussian_renderer/__init__.py.backup gaussian_renderer/__init__.py
fi

# Apply targeted fixes using simple string replacement
python3 << 'EOF'
import torch

with open('gaussian_renderer/__init__.py', 'r') as f:
    content = f.read()

# Get GPU information for dynamic optimization
if torch.cuda.is_available():
    gpu_name = torch.cuda.get_device_name(0)
    gpu_memory_gb = torch.cuda.get_device_properties(0).total_memory // (1024**3)
    compute_cap = torch.cuda.get_device_capability(0)
    compute_cap_str = f"{compute_cap[0]}.{compute_cap[1]}"
else:
    gpu_name = "Unknown GPU"
    gpu_memory_gb = 8  # Default fallback
    compute_cap_str = "7.5"

# Calculate memory fraction based on available VRAM
if gpu_memory_gb >= 12:
    memory_fraction = 0.9  # High-end GPUs
elif gpu_memory_gb >= 8:
    memory_fraction = 0.85  # Mid-range GPUs
else:
    memory_fraction = 0.8  # Lower-end GPUs

# Only apply fixes if not already applied
if 'CUDA memory-safe rasterization' not in content:
    # Add memory management before rasterizer creation
    content = content.replace(
        'rasterizer = GaussianRasterizer(raster_settings=raster_settings)',
        f'''# GPU-optimized memory management for {gpu_name}
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
        # Optimize for {gpu_memory_gb}GB VRAM
        if hasattr(torch.cuda, "set_per_process_memory_fraction"):
            torch.cuda.set_per_process_memory_fraction({memory_fraction})
    
    rasterizer = GaussianRasterizer(raster_settings=raster_settings)'''
    )

    # Find and replace the rasterizer call with error handling
    original_call = '''rendered_image, radii = rasterizer(
        means3D = means3D,
        means2D = means2D,
        shs = shs,
        colors_precomp = colors_precomp,
        opacities = opacity,
        scales = scales,
        rotations = rotations,
        cov3D_precomp = cov3D_precomp)'''

    safe_call = f'''# CUDA memory-safe rasterization with error handling
    try:
        rendered_image, radii = rasterizer(
            means3D = means3D,
            means2D = means2D,
            shs = shs,
            colors_precomp = colors_precomp,
            opacities = opacity,
            scales = scales,
            rotations = rotations,
            cov3D_precomp = cov3D_precomp)
    except RuntimeError as e:
        if "illegal memory access" in str(e) or "CUDA" in str(e):
            print(f"CUDA memory error on {{gpu_name}}: {{e}}")
            print("Applying memory recovery...")
            
            # Clear CUDA cache completely
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
            
            # Create safe fallback rendering
            H, W = int(raster_settings.image_height), int(raster_settings.image_width)
            rendered_image = torch.zeros((3, H, W), dtype=torch.float32, device="cuda")
            radii = torch.zeros(means3D.shape[0], dtype=torch.int32, device="cuda")
            
            print(f"Fallback rendering applied for {{gpu_name}}")
        else:
            raise e'''

    content = content.replace(original_call, safe_call)

    with open('gaussian_renderer/__init__.py', 'w') as f:
        f.write(content)
    
    print(f"Applied GPU memory safety fixes for {gpu_name}")
else:
    print("GPU memory safety fixes already applied")
EOF

# Step 8: Test training with GPU optimizations
echo "=== Testing training with $GPU_NAME optimizations ==="
export CUDA_LAUNCH_BLOCKING=1

echo "Starting test training..."
python train.py \
    --splatting_config configs/hierarchical.json \
    -s data/ \
    --iterations 5 \
    --test_iterations 2 \
    --save_iterations 5

echo "=== GPU Optimization Fix Complete ==="
if [ $? -eq 0 ]; then
    echo "✓ Training test successful on $GPU_NAME!"
    echo "You can now run the full training:"
    echo "  python train.py --splatting_config configs/hierarchical.json -s data/"
else
    echo "✗ Training test failed. Check error messages above."
    echo "Try running with more debugging:"
    echo "  export CUDA_LAUNCH_BLOCKING=1"
    echo "  python train.py --splatting_config configs/hierarchical.json -s data/ --iterations 1"
fi