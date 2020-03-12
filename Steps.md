# 1. 数据

## 1.1 数据获取

以 canvas/img/Image 的形式，然后存储在 Float32Array 中

## 1.2 数据存储

BufferGeometry && BufferAttribute

## 1.3 纹理

法向纹理

# 2. 显示

构建基于 RTIN 的 error 矩阵

根据一次 error 矩阵，然后和给定一个 maxError 值就可以输出对应的精度图，并且可以从树的顶部开始

对树进行分割处理(还需要重新组织)，可以增加流程程度和渐进式输出效果

-   视点相关（增加相关的 error）
-   远处重要的事物（error）
