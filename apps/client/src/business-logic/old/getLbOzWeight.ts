// export function getLbOzWeight(oz: number): string {
//   const lbs = Math.floor(oz / 16);
//   const remainingOz = Math.ceil(oz % 16);

//   if (remainingOz === 16) {
//     return lbs === 0 ? "1lb 0oz" : `${lbs + 1}lbs 0oz`;
//   }

//   return lbs === 1 ? `1lb ${remainingOz}oz` : `${lbs}lbs ${remainingOz}oz`;
// }