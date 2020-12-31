export const MAX_LEVEL = 12
export const MIN_ATTACH_DISTANCE = 0.001 // 吸附距离，点和边界距离小于该值的认为处于边界上
export const MIN_VIEW_DISTANCE = 0.02 // 相邻点最小间距，间距小于该值的点认为重复
export const MIN_SPLIT_DISTANCE = 0.001 // 最小分裂垂距值。垂距的投影大于该值则进行分裂，该值越小，分裂地越细
export const childPartTypes = ["tl", "tr", "bl", "br"]
