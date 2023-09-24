import uPlot from "./uPlot.esm.js";
import global from "./quadtree.js";
import distr from "./distr.js";

export default function timelinePlugin(opts) {
				const { mode, count, fill, stroke } = opts;
				const { round, min, max, ceil } = Math;
				const pxRatio    = window.devicePixelRatio;

				const laneWidth   = 0.9;
				const laneDistr   = 2;

				const font      = round(14 * pxRatio) + "px Arial";

				function walk(yIdx, count, dim, draw) {
					distr(count, laneWidth, laneDistr, yIdx, (i, offPct, dimPct) => {
						let laneOffPx = dim * offPct;
						let laneWidPx = dim * dimPct;

						draw(i, laneOffPx, laneWidPx);
					});
				}

				const size  = opts.size  ?? [0.6, Infinity];
				const align = opts.align ?? 0;

				const gapFactor = 1 - size[0];
				const maxWidth  = (size[1] ?? inf) * pxRatio;

				const fillPaths = new Map();
				const strokePaths = new Map();

				function drawBoxes(ctx) {
					fillPaths.forEach((fillPath, fillStyle) => {
						ctx.fillStyle = fillStyle;
						ctx.fill(fillPath);
					});

					strokePaths.forEach((strokePath, strokeStyle) => {
						ctx.strokeStyle = strokeStyle;
						ctx.stroke(strokePath);
					});

					fillPaths.clear();
					strokePaths.clear();
				}

function pointWithin(px, py, rlft, rtop, rrgt, rbtm) {
    return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}


				function putBox(ctx, rect, xOff, yOff, lft, top, wid, hgt, strokeWidth, iy, ix, value) {
					let fillStyle = fill(iy + 1, ix, value);
					let fillPath =  fillPaths.get(fillStyle);

					if (fillPath == null)
						fillPaths.set(fillStyle, fillPath = new Path2D());

					rect(fillPath, lft, top, wid, hgt);

					if (strokeWidth) {
						let strokeStyle = stroke(iy + 1, ix, value);
						let strokePath = strokePaths.get(strokeStyle);

						if (strokePath == null)
							strokePaths.set(strokeStyle, strokePath = new Path2D());

						rect(strokePath, lft + strokeWidth / 2, top + strokeWidth / 2, wid - strokeWidth, hgt - strokeWidth);
					}

					qt.add({
						x: round(lft - xOff),
						y: round(top - yOff),
						w: wid,
						h: hgt,
						sidx: iy + 1,
						didx: ix
					});
				}

				function drawPaths(u, sidx, idx0, idx1) {
					uPlot.orient(u, sidx, (series, dataX, dataY, scaleX, scaleY, valToPosX, valToPosY, xOff, yOff, xDim, yDim, moveTo, lineTo, rect) => {
						let strokeWidth = round((series.width || 0) * pxRatio);

						u.ctx.save();
						rect(u.ctx, u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
						u.ctx.clip();

						walk(sidx - 1, count, yDim, (iy, y0, hgt) => {
							// draw spans
							if (mode == 1) {
								for (let ix = 0; ix < dataY.length; ix++) {
									if (dataY[ix] != null) {
										let lft = round(valToPosX(dataX[ix], scaleX, xDim, xOff));

										let nextIx = ix;
										while (dataY[++nextIx] === undefined && nextIx < dataY.length) {}

										// to now (not to end of chart)
										let rgt = nextIx == dataY.length ? xOff + xDim + strokeWidth : round(valToPosX(dataX[nextIx], scaleX, xDim, xOff));

										putBox(
											u.ctx,
											rect,
											xOff,
											yOff,
											lft,
											round(yOff + y0),
											rgt - lft,
											round(hgt),
											strokeWidth,
											iy,
											ix,
											dataY[ix]
										);

										ix = nextIx - 1;
									}
								}
							}
							// draw matrix
							else {
								let colWid = valToPosX(dataX[1], scaleX, xDim, xOff) - valToPosX(dataX[0], scaleX, xDim, xOff);
								let gapWid = colWid * gapFactor;
								let barWid = round(min(maxWidth, colWid - gapWid) - strokeWidth);
								let xShift = align == 1 ? 0 : align == -1 ? barWid : barWid / 2;

								for (let ix = idx0; ix <= idx1; ix++) {
									if (dataY[ix] != null) {
										// TODO: all xPos can be pre-computed once for all series in aligned set
										let lft = valToPosX(dataX[ix], scaleX, xDim, xOff);

										putBox(
											u.ctx,
											rect,
											xOff,
											yOff,
											round(lft - xShift),
											round(yOff + y0),
											barWid,
											round(hgt),
											strokeWidth,
											iy,
											ix,
											dataY[ix]
										);
									}
								}
							}
						});

						u.ctx.lineWidth = strokeWidth;
						drawBoxes(u.ctx);

						u.ctx.restore();
					});

					return null;
				}

				function drawPoints(u, sidx, i0, i1) {
					u.ctx.save();
					u.ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
					u.ctx.clip();

					u.ctx.font         = font;
					u.ctx.fillStyle    = "black";
					u.ctx.textAlign    = mode == 1 ? "left" : "center";
					u.ctx.textBaseline = "middle";

					uPlot.orient(u, sidx, (series, dataX, dataY, scaleX, scaleY, valToPosX, valToPosY, xOff, yOff, xDim, yDim, moveTo, lineTo, rect) => {
						let strokeWidth = round((series.width || 0) * pxRatio);
						let textOffset = mode == 1 ? strokeWidth + 2 : 0;

						let y = round(yOff + yMids[sidx - 1]);

						for (let ix = 0; ix < dataY.length; ix++) {
							if (dataY[ix] != null) {
								let x = valToPosX(dataX[ix], scaleX, xDim, xOff) + textOffset;
								u.ctx.fillText(dataY[ix], x, y);
							}
						}
					});

					u.ctx.restore();

					return false;
				}

				let qt;
				let hovered = Array(count).fill(null);

				let yMids = Array(count).fill(0);
  				let ySplits = Array(count).fill(0);

				let fmtDate = uPlot.fmtDate('{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}');
				let legendTimeValueEl = null;

				return {
					hooks: {
						init: u => {
							legendTimeValueEl = u.root.querySelector('.u-series:first-child .u-value');
						},
						drawClear: u => {
							qt = qt || new global.Quadtree(0, 0, u.bbox.width, u.bbox.height);

							qt.clear();

							// force-clear the path cache to cause drawBars() to rebuild new quadtree
							u.series.forEach(s => {
								s._paths = null;
							});
						},
						setCursor: u => {
							if (mode == 1) {
								let val = u.posToVal(u.cursor.left, 'x');
								legendTimeValueEl.textContent = u.scales.x.time ? fmtDate(new Date(val * 1e3)) : val.toFixed(2);
							}
						},
					},
					opts: (u, opts) => {
						uPlot.assign(opts, {
							cursor: {
							//	x: false,
								y: false,
								points: {show: false},
								dataIdx: (u, seriesIdx, closestIdx, xValue) => {
									if (seriesIdx == 0)
										return closestIdx;

									let cx = round(u.cursor.left * pxRatio);

									if (cx >= 0) {
										let cy = yMids[seriesIdx - 1];

										hovered[seriesIdx - 1] = null;

										qt.get(cx, cy, 1, 1, o => {
											if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h))
												hovered[seriesIdx - 1] = o;
										});
									}

									return hovered[seriesIdx - 1]?.didx;
								},
								points: {
									fill: "rgba(0,0,0,0.3)",
									bbox: (u, seriesIdx) => {
										let hRect = hovered[seriesIdx - 1];

										return {
											left:   hRect ? round(hRect.x / devicePixelRatio) : -10,
											top:    hRect ? round(hRect.y / devicePixelRatio) : -10,
											width:  hRect ? round(hRect.w / devicePixelRatio) : 0,
											height: hRect ? round(hRect.h / devicePixelRatio) : 0,
										};
									}
								}
							},
							scales: {
								x: {
									range(u, min, max) {
										if (mode == 2) {
											let colWid = u.data[0][1] - u.data[0][0];
											let scalePad = colWid/2;

											if (min <= u.data[0][0])
												min = u.data[0][0] - scalePad;

											let lastIdx = u.data[0].length - 1;

											if (max >= u.data[0][lastIdx])
												max = u.data[0][lastIdx] + scalePad;
										}

										return [min, max];
									}
								},
								y: {
									range: [0, 1],
								}
							}
						});

						uPlot.assign(opts.axes[0], {
							splits: mode == 2 ? (u, axisIdx, scaleMin, scaleMax, foundIncr, foundSpace) => {
								let splits = [];

								let dataIncr = u.data[0][1] - u.data[0][0];
								let skipFactor = ceil(foundIncr / dataIncr);

								for (let i = 0; i < u.data[0].length; i += skipFactor) {
									let v = u.data[0][i];

									if (v >= scaleMin && v <= scaleMax)
										splits.push(v);
								}

								return splits;
							} : null,
							grid: {
								show: mode != 2
							}
						});

						uPlot.assign(opts.axes[1], {
							splits: (u, axisIdx) => {
								walk(null, count, u.bbox.height, (iy, y0, hgt) => {
									// vertical midpoints of each series' timeline (stored relative to .u-over)
									yMids[iy] = round(y0 + hgt / 2);
									ySplits[iy] = u.posToVal(yMids[iy] / pxRatio, "y");
								});

								return ySplits;
							},
							values:     () => Array(count).fill(null).map((v, i) => u.series[i + 1].label),
							gap:        15,
							size:       70,
							grid:       {show: false},
							ticks:      {show: false},

							side:       3,
						});

						opts.series.forEach((s, i) => {
							if (i > 0) {
								uPlot.assign(s, {
								//	width: 0,
								//	pxAlign: false,
								//	stroke: "rgba(255,0,0,0.5)",
									paths: drawPaths,
									points: {
										show: drawPoints
									}
								});
							}
						});
					}
				};
			}
