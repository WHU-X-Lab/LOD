export class Line {
  constructor(data) {
    this.minAttachDistance = 0.001;
    this.rankedArray = [];
    for (let i = 0; i < data.length; i += 3) {
      this.rankedArray.push(this.rank(data[i], data[i + 1], data[i + 2]));
    }
  }
  rank(x, y, z) {
    let [rankX, rankY] = [0, 0];
    let { minAttachDistance } = this;
    while (x % Math.pow(1 / 2, rankX) > minAttachDistance) {
      rankX++;
    }
    while (y % Math.pow(1 / 2, rankY) > minAttachDistance && rankY < rankX) {
      rankY++;
    }
    return { rank: Math.max(rankX, rankY), value: [x, y, z] };
  }
  getRankedArray(rank) {
    return this.rankedArray.reduce((prev, curr) => {
      if (curr.rank <= rank) {
        prev.push(...curr.value);
        return prev;
      } else {
        return prev;
      }
    }, []);
  }
}
