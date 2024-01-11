# Threejs-WebGPU-IFFT-Ocean-V1

This is the first version of my threejs WebGPU ocean. There is still a lot to do but also a lot has already been achieved.

The camera can be moved using arrow keys and WASD

For vite I just added a config. So if you want to use vite you still have to install vite. 
The reason I don't have vite installed is because it uses 100MB more.
Anyone who uses Visual Studio Code with the live server can run this code directly after downloading.

There's still a lot missing and I've only made the camera controls rudimentary because the focus so far has been on implementing the wave generator. This now works very well.

Not all parameters are in the GUI

- ocean/ocean-constants.js QT_OCEAN_MIN_CELL_RESOLUTION: 12,  must be a multiple of 2
- waves/wave-constants.js TEXTURE_SIZE: 256,  must be 2^n = ... 32,..., 128, 256, 512, ...

My goal is a great Ocean in ThreeJS and a lot more is needed.
The increasing noise with distance comes from the fact that there are more and more texture pixels on fewer and fewer screen pixels. This will be solved with:

- mipmaps
- bilinear filter (linearMipmapLinearFilter)
- anisotropy

These mechanisms adapt the number of texture pixels better to the number of screen pixels as the distance increases and the viewing angle becomes shallower. This avoids competition between the currently superfluous vectors and color values ​​as the distance increases and further improves performance.
There will be more important elements included that will ensure that you can see through the water with authentic light refraction and absorption...
All of these things will come and contribute to the ocean becoming photorealistic.

P.S. With threejs r160 I integrated mipmaps, filters and anisotropy. But not uploaded here yet. I would like to do a general update only with further important extensions in threejs.

