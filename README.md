# Threejs-WebGPU-IFFT-Ocean-V1

This is the first version of my threejs webGPU oceans. There is still a lot to do but also a lot has already been achieved.

The camera can be moved using arrow keys and WASD

For vite I just added a config. So if you want to use vite you still have to install vite. 
The reason I don't have vite installed is because it uses 100MB more.
Anyone who uses Visual Studio Code with the live server can run this code directly after downloading.

There's still a lot missing and I've only made the camera controls rudimentary because the focus so far has been on implementing the wave generator. This now works very well.

Not all parameters are in the GUI

ocean/ocean-constants.js QT_OCEAN_MIN_CELL_RESOLUTION: 12,  must be a multiple of 2
waves/wave-constants.js TEXTURE_SIZE: 256,  must be 2^n = ... 32,..., 128, 256, 512, ...



