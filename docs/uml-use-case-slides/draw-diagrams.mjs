import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "diagrams", "svg");
mkdirSync(outDir, { recursive: true });

const ink = "#1C1917";
const font = "Arial, Helvetica, sans-serif";

function ellipseEdge(cx, cy, rx, ry, tx, ty) {
  const dx = tx - cx;
  const dy = ty - cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const t = 1 / Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry));
  return [cx + ux * t, cy + uy * t];
}

function actor(x, y, labelLines) {
  const r = 16;
  const hip = y + r + 44;
  const labels = labelLines
    .map(
      (line, index) =>
        `<text x="${x}" y="${hip + 36 + index * 20}" text-anchor="middle" font-family="${font}" font-size="16" fill="${ink}">${line}</text>`,
    )
    .join("");
  return `<g>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#F5F5F4" stroke="${ink}" stroke-width="1.6"/>
    <path d="M${x} ${y + r} V${hip} M${x - 22} ${y + r + 16} H${x + 22} M${x} ${hip} L${x - 18} ${hip + 28} M${x} ${hip} L${x + 18} ${hip + 28}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
    ${labels}
  </g>`;
}

function useCase(cx, cy, rx, ry, label) {
  const lines = Array.isArray(label) ? label : [label];
  const start = cy - ((lines.length - 1) * 18) / 2;
  const text = lines
    .map(
      (line, index) =>
        `<text x="${cx}" y="${start + index * 18}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="16" fill="${ink}">${line}</text>`,
    )
    .join("");
  return `<g>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FFFFFF" stroke="${ink}" stroke-width="1.6"/>
    ${text}
  </g>`;
}

function boundary(x, y, width, height, title) {
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#FAFAF9" stroke="#44403C" stroke-width="1.8"/>
    <text x="${x + width / 2}" y="${y + 28}" text-anchor="middle" font-family="${font}" font-size="18" font-weight="700" fill="#44403C">${title}</text>
  </g>`;
}

function plain(x1, y1, x2, y2) {
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${ink}" stroke-width="1.6"/>`;
}

function openArrow(x1, y1, x2, y2, label, offset = 22) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 13;
  const wing = 6.5;
  const bx = x2 - ux * size;
  const by = y2 - uy * size;
  const px = -uy * wing;
  const py = ux * wing;
  const lines = label == null ? [] : Array.isArray(label) ? label : [label];
  const mx = (x1 + bx) / 2 - uy * offset;
  const my = (y1 + by) / 2 + ux * offset;
  const labelMarkup = lines
    .map((line, index) => {
      const y = my + (index - (lines.length - 1) / 2) * 18;
      return `<text x="${mx.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="15" fill="${ink}" stroke="#FFFFFF" stroke-width="5" paint-order="stroke">${line}</text>`;
    })
    .join("");
  return `<g>
    <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${ink}" stroke-width="1.6" stroke-dasharray="7 5"/>
    <polyline points="${(bx + px).toFixed(1)},${(by + py).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${(bx - px).toFixed(1)},${(by - py).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linejoin="miter"/>
    ${labelMarkup}
  </g>`;
}

function hollowTriangle(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 16;
  const wing = 8;
  const bx = x2 - ux * size;
  const by = y2 - uy * size;
  const px = -uy * wing;
  const py = ux * wing;
  return `<g>
    <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${ink}" stroke-width="1.6"/>
    <polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(bx + px).toFixed(1)},${(by + py).toFixed(1)} ${(bx - px).toFixed(1)},${(by - py).toFixed(1)}" fill="#FFFFFF" stroke="${ink}" stroke-width="1.6" stroke-linejoin="miter"/>
  </g>`;
}

function actorPort(ax, ay, fromRight) {
  return [fromRight ? ax - 40 : ax + 40, ay + 52];
}

function solidArrow(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 13;
  const wing = 6.5;
  const bx = x2 - ux * size;
  const by = y2 - uy * size;
  const px = -uy * wing;
  const py = ux * wing;
  return `<g>
    <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${ink}" stroke-width="1.6"/>
    <polyline points="${(bx + px).toFixed(1)},${(by + py).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${(bx - px).toFixed(1)},${(by - py).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linejoin="miter"/>
  </g>`;
}

function linkActorArrow(ax, ay, uc, fromRight) {
  const [anchorX, anchorY] = actorPort(ax, ay, fromRight);
  const [x2, y2] = ellipseEdge(uc.cx, uc.cy, uc.rx, uc.ry, anchorX, anchorY);
  return solidArrow(anchorX, anchorY, x2, y2);
}

function linkActorToUse(ax, ay, uc, fromRight) {
  const [anchorX, anchorY] = actorPort(ax, ay, fromRight);
  const [x2, y2] = ellipseEdge(uc.cx, uc.cy, uc.rx, uc.ry, anchorX, anchorY);
  return plain(anchorX, anchorY, x2, y2);
}

function linkUses(from, to, toward, drawer) {
  const [x1, y1] = ellipseEdge(from.cx, from.cy, from.rx, from.ry, toward.cx, toward.cy);
  const [x2, y2] = ellipseEdge(to.cx, to.cy, to.rx, to.ry, from.cx, from.cy);
  return drawer(x1, y1, x2, y2);
}

function arrowBetween(from, to, label, offset) {
  return linkUses(from, to, to, (x1, y1, x2, y2) => openArrow(x1, y1, x2, y2, label, offset));
}

function poly(points) {
  const coords = points.map((point) => `${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(" ");
  return `<polyline points="${coords}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function linkFromBelow(ax, headY, uc) {
  const startY = headY - 24;
  const [edgeX, edgeY] = ellipseEdge(uc.cx, uc.cy, uc.rx, uc.ry, ax, startY);
  return plain(ax, startY, edgeX, edgeY);
}

function busTo(anchor, busX, uc) {
  const [edgeX, edgeY] = ellipseEdge(uc.cx, uc.cy, uc.rx, uc.ry, busX, uc.cy);
  return poly([
    anchor,
    [busX, anchor[1]],
    [busX, uc.cy],
    [edgeX, edgeY],
  ]);
}

function svg(width, height, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  ${body}
</svg>
`;
}

const login = { cx: 520, cy: 130, rx: 72, ry: 32 };
const balance = { cx: 520, cy: 250, rx: 104, ry: 34 };
const transfer = { cx: 520, cy: 370, rx: 104, ry: 34 };
const payment = { cx: 520, cy: 490, rx: 108, ry: 34 };

const boundarySvg = svg(
  980,
  480,
  [
    boundary(170, 24, 640, 430, "Banking App"),
    linkActorToUse(80, 170, { cx: 490, cy: 170, rx: 72, ry: 32 }, false),
    linkActorToUse(80, 170, { cx: 490, cy: 320, rx: 104, ry: 34 }, false),
    linkActorToUse(900, 280, { cx: 490, cy: 320, rx: 104, ry: 34 }, true),
    useCase(490, 170, 72, 32, "Log In"),
    useCase(490, 320, 104, 34, "Check Balance"),
    actor(80, 170, ["Customer"]),
    actor(900, 280, ["Bank"]),
  ].join("\n"),
);

const primarySvg = svg(
  980,
  380,
  [
    boundary(190, 48, 600, 280, "Banking App"),
    linkActorToUse(90, 170, { cx: 490, cy: 200, rx: 104, ry: 34 }, false),
    linkActorToUse(890, 170, { cx: 490, cy: 200, rx: 104, ry: 34 }, true),
    useCase(490, 200, 104, 34, "Check Balance"),
    actor(90, 170, ["Customer", "(primary)"]),
    actor(890, 170, ["Bank", "(supporting)"]),
  ].join("\n"),
);

const goalsSvg = svg(
  1040,
  640,
  [
    boundary(160, 20, 720, 600, "Banking App"),
    linkActorToUse(78, 300, login, false),
    linkActorToUse(78, 300, balance, false),
    linkActorToUse(78, 300, transfer, false),
    linkActorToUse(78, 300, payment, false),
    linkActorToUse(962, 360, balance, true),
    linkActorToUse(962, 360, transfer, true),
    linkActorToUse(962, 360, payment, true),
    useCase(login.cx, login.cy, login.rx, login.ry, "Log In"),
    useCase(balance.cx, balance.cy, balance.rx, balance.ry, "Check Balance"),
    useCase(transfer.cx, transfer.cy, transfer.rx, transfer.ry, "Transfer Funds"),
    useCase(payment.cx, payment.cy, payment.rx, payment.ry, "Make Payment"),
    actor(78, 300, ["Customer"]),
    actor(962, 360, ["Bank"]),
  ].join("\n"),
);

const dle = { cx: 330, cy: 120, rx: 118, ry: 34 };
const logIn = { cx: 640, cy: 120, rx: 72, ry: 32 };
const verifyPassword = { cx: 960, cy: 120, rx: 108, ry: 34 };
const checkBalance = { cx: 640, cy: 270, rx: 104, ry: 32 };
const transferFunds = { cx: 640, cy: 420, rx: 104, ry: 32 };
const verifyFunds = { cx: 990, cy: 492, rx: 108, ry: 28 };
const makePayment = { cx: 640, cy: 620, rx: 108, ry: 32 };
const payChecking = { cx: 430, cy: 790, rx: 112, ry: 32 };
const paySavings = { cx: 820, cy: 790, rx: 108, ry: 32 };
const customer = { x: 78, y: 360 };
const bank = { x: 1248, y: 430 };

const completeSvg = svg(
  1340,
  900,
  [
    boundary(160, 16, 1000, 860, "Banking App"),
    linkActorToUse(customer.x, customer.y, logIn, false),
    linkActorToUse(customer.x, customer.y, checkBalance, false),
    linkActorToUse(customer.x, customer.y, transferFunds, false),
    linkActorToUse(customer.x, customer.y, makePayment, false),
    linkActorToUse(bank.x, bank.y, checkBalance, true),
    linkActorToUse(bank.x, bank.y, transferFunds, true),
    linkActorToUse(bank.x, bank.y, makePayment, true),
    linkUses(dle, logIn, logIn, (x1, y1, x2, y2) => openArrow(x1, y1, x2, y2, "«extend»")),
    linkUses(logIn, verifyPassword, verifyPassword, (x1, y1, x2, y2) => openArrow(x1, y1, x2, y2, "«include»")),
    linkUses(transferFunds, verifyFunds, verifyFunds, (x1, y1, x2, y2) => openArrow(x1, y1, x2, y2, "«include»")),
    linkUses(makePayment, verifyFunds, verifyFunds, (x1, y1, x2, y2) => openArrow(x1, y1, x2, y2, "«include»")),
    linkUses(payChecking, makePayment, makePayment, hollowTriangle),
    linkUses(paySavings, makePayment, makePayment, hollowTriangle),
    useCase(dle.cx, dle.cy, dle.rx, dle.ry, "Display Login Error"),
    useCase(logIn.cx, logIn.cy, logIn.rx, logIn.ry, "Log In"),
    useCase(verifyPassword.cx, verifyPassword.cy, verifyPassword.rx, verifyPassword.ry, "Verify Password"),
    useCase(checkBalance.cx, checkBalance.cy, checkBalance.rx, checkBalance.ry, "Check Balance"),
    useCase(transferFunds.cx, transferFunds.cy, transferFunds.rx, transferFunds.ry, "Transfer Funds"),
    useCase(makePayment.cx, makePayment.cy, makePayment.rx, makePayment.ry, "Make Payment"),
    useCase(verifyFunds.cx, verifyFunds.cy, verifyFunds.rx, verifyFunds.ry, ["Verify Sufficient", "Funds"]),
    useCase(payChecking.cx, payChecking.cy, payChecking.rx, payChecking.ry, "Pay from Checking"),
    useCase(paySavings.cx, paySavings.cy, paySavings.rx, paySavings.ry, "Pay from Savings"),
    actor(customer.x, customer.y, ["Customer"]),
    actor(bank.x, bank.y, ["Bank"]),
  ].join("\n"),
);

const libSearch = { cx: 400, cy: 100, rx: 100, ry: 30 };
const libBorrow = { cx: 400, cy: 210, rx: 100, ry: 30 };
const libReturn = { cx: 400, cy: 320, rx: 100, ry: 30 };
const libFine = { cx: 400, cy: 430, rx: 88, ry: 30 };
const libCheck = { cx: 760, cy: 210, rx: 120, ry: 32 };
const libNotice = { cx: 760, cy: 320, rx: 120, ry: 34 };
const libCatalog = { cx: 760, cy: 520, rx: 112, ry: 32 };

const librarySvg = svg(
  1200,
  700,
  [
    boundary(170, 16, 860, 660, "Library System"),
    linkActorArrow(70, 250, libSearch, false),
    linkActorToUse(70, 250, libBorrow, false),
    linkActorToUse(70, 250, libReturn, false),
    linkActorToUse(70, 250, libFine, false),
    linkActorToUse(1130, 400, libFine, true),
    linkActorToUse(560, 530, libCatalog, false),
    linkActorToUse(990, 210, libCheck, true),
    arrowBetween(libCheck, libBorrow, "«include»", 36),
    arrowBetween(libReturn, libNotice, "«extend»", -36),
    useCase(libSearch.cx, libSearch.cy, libSearch.rx, libSearch.ry, "Search Books"),
    useCase(libBorrow.cx, libBorrow.cy, libBorrow.rx, libBorrow.ry, "Borrow Book"),
    useCase(libReturn.cx, libReturn.cy, libReturn.rx, libReturn.ry, "Return Book"),
    useCase(libFine.cx, libFine.cy, libFine.rx, libFine.ry, "Pay Fine"),
    useCase(libCheck.cx, libCheck.cy, libCheck.rx, libCheck.ry, "Check Availability"),
    useCase(libNotice.cx, libNotice.cy, libNotice.rx, libNotice.ry, ["Send Overdue", "Notice"]),
    useCase(libCatalog.cx, libCatalog.cy, libCatalog.rx, libCatalog.ry, "Catalog Screen"),
    actor(70, 250, ["John"]),
    actor(1130, 400, ["Payment Service"]),
    actor(560, 530, ["Librarian"]),
    actor(990, 210, ["Database"]),
  ].join("\n"),
);

const fixedCatalog = { cx: 760, cy: 520, rx: 116, ry: 32 };

const libraryFixedSvg = svg(
  1200,
  700,
  [
    boundary(170, 16, 860, 660, "Library System"),
    linkActorToUse(70, 250, libSearch, false),
    linkActorToUse(70, 250, libBorrow, false),
    linkActorToUse(70, 250, libReturn, false),
    linkActorToUse(70, 250, libFine, false),
    linkActorToUse(1130, 340, libFine, true),
    linkActorToUse(1130, 540, fixedCatalog, true),
    arrowBetween(libBorrow, libCheck, "«include»", -36),
    arrowBetween(libNotice, libReturn, ["«extend»", "book is overdue"], 48),
    useCase(libSearch.cx, libSearch.cy, libSearch.rx, libSearch.ry, "Search Books"),
    useCase(libBorrow.cx, libBorrow.cy, libBorrow.rx, libBorrow.ry, "Borrow Book"),
    useCase(libReturn.cx, libReturn.cy, libReturn.rx, libReturn.ry, "Return Book"),
    useCase(libFine.cx, libFine.cy, libFine.rx, libFine.ry, "Pay Fine"),
    useCase(libCheck.cx, libCheck.cy, libCheck.rx, libCheck.ry, "Check Availability"),
    useCase(libNotice.cx, libNotice.cy, libNotice.rx, libNotice.ry, ["Send Overdue", "Notice"]),
    useCase(fixedCatalog.cx, fixedCatalog.cy, fixedCatalog.rx, fixedCatalog.ry, "Manage Catalog"),
    actor(70, 250, ["Member"]),
    actor(1130, 340, ["Payment Service"]),
    actor(1130, 540, ["Librarian"]),
  ].join("\n"),
);

const sharedLogin = { cx: 390, cy: 130, rx: 78, ry: 32 };
const sharedPassword = { cx: 760, cy: 130, rx: 116, ry: 32 };
const sharedTransfer = { cx: 400, cy: 320, rx: 116, ry: 32 };
const sharedPayment = { cx: 400, cy: 530, rx: 116, ry: 32 };
const sharedFunds = { cx: 760, cy: 425, rx: 128, ry: 34 };
const sharedBankPort = [1088, 425];

const sharedSvg = svg(
  1240,
  680,
  [
    boundary(160, 20, 880, 640, "Banking App"),
    linkActorToUse(72, 300, sharedLogin, false),
    linkActorToUse(72, 300, sharedTransfer, false),
    linkActorToUse(72, 300, sharedPayment, false),
    busTo(sharedBankPort, 990, sharedTransfer),
    busTo(sharedBankPort, 990, sharedPayment),
    arrowBetween(sharedLogin, sharedPassword, "«include»", -28),
    arrowBetween(sharedTransfer, sharedFunds, "«include»", -26),
    arrowBetween(sharedPayment, sharedFunds, "«include»", 26),
    useCase(sharedLogin.cx, sharedLogin.cy, sharedLogin.rx, sharedLogin.ry, "Log In"),
    useCase(sharedPassword.cx, sharedPassword.cy, sharedPassword.rx, sharedPassword.ry, "Verify Password"),
    useCase(sharedTransfer.cx, sharedTransfer.cy, sharedTransfer.rx, sharedTransfer.ry, "Transfer Funds"),
    useCase(sharedPayment.cx, sharedPayment.cy, sharedPayment.rx, sharedPayment.ry, "Make Payment"),
    useCase(sharedFunds.cx, sharedFunds.cy, sharedFunds.rx, sharedFunds.ry, ["Verify Sufficient", "Funds"]),
    actor(72, 300, ["Customer"]),
    actor(1128, 373, ["Bank"]),
  ].join("\n"),
);

const extendLogin = { cx: 640, cy: 210, rx: 78, ry: 34 };
const extendError = { cx: 300, cy: 210, rx: 124, ry: 36 };

const extendSvg = svg(
  1080,
  420,
  [
    boundary(150, 36, 760, 300, "Banking App"),
    linkActorToUse(1000, 160, extendLogin, true),
    arrowBetween(extendError, extendLogin, ["«extend»", "password is incorrect"], -42),
    useCase(extendError.cx, extendError.cy, extendError.rx, extendError.ry, ["Display", "Login Error"]),
    useCase(extendLogin.cx, extendLogin.cy, extendLogin.rx, extendLogin.ry, "Log In"),
    actor(1000, 160, ["Customer"]),
  ].join("\n"),
);

const compareError = { cx: 250, cy: 230, rx: 124, ry: 36 };
const compareLogin = { cx: 560, cy: 230, rx: 78, ry: 34 };
const comparePassword = { cx: 860, cy: 230, rx: 116, ry: 34 };

const compareSvg = svg(
  1100,
  520,
  [
    boundary(80, 24, 960, 300, "Banking App"),
    linkFromBelow(560, 400, compareLogin),
    arrowBetween(compareError, compareLogin, ["«extend»", "password is incorrect"], -68),
    arrowBetween(compareLogin, comparePassword, "«include»", -52),
    useCase(compareError.cx, compareError.cy, compareError.rx, compareError.ry, ["Display", "Login Error"]),
    useCase(compareLogin.cx, compareLogin.cy, compareLogin.rx, compareLogin.ry, "Log In"),
    useCase(comparePassword.cx, comparePassword.cy, comparePassword.rx, comparePassword.ry, "Verify Password"),
    actor(560, 400, ["Customer"]),
  ].join("\n"),
);

const profile = { cx: 820, cy: 280, rx: 200, ry: 125 };
const profileHelp = { cx: 250, cy: 175, rx: 145, ry: 36 };
const profilePrivacy = { cx: 250, cy: 385, rx: 150, ry: 36 };

function profileCase() {
  return `<g>
    <ellipse cx="${profile.cx}" cy="${profile.cy}" rx="${profile.rx}" ry="${profile.ry}" fill="#FFFFFF" stroke="${ink}" stroke-width="1.6"/>
    <text x="${profile.cx}" y="${profile.cy - 64}" text-anchor="middle" font-family="${font}" font-size="18" font-weight="700" fill="${ink}">Set Up Profile</text>
    <line x1="${profile.cx - 145}" y1="${profile.cy - 42}" x2="${profile.cx + 145}" y2="${profile.cy - 42}" stroke="#44403C" stroke-width="1.2"/>
    <text x="${profile.cx}" y="${profile.cy - 16}" text-anchor="middle" font-family="${font}" font-size="14" fill="#44403C">extension points</text>
    <text x="${profile.cx}" y="${profile.cy + 16}" text-anchor="middle" font-family="${font}" font-size="16" fill="${ink}">profile help</text>
    <text x="${profile.cx}" y="${profile.cy + 46}" text-anchor="middle" font-family="${font}" font-size="16" fill="${ink}">privacy information</text>
  </g>`;
}

function arrowToward(from, hint, labelX, labelY, lines) {
  const [x2, y2] = ellipseEdge(profile.cx, profile.cy, profile.rx, profile.ry, hint[0], hint[1]);
  const [x1, y1] = ellipseEdge(from.cx, from.cy, from.rx, from.ry, x2, y2);
  const texts = lines
    .map(
      (line, index) =>
        `<text x="${labelX}" y="${labelY + index * 18}" text-anchor="middle" font-family="${font}" font-size="15" fill="${ink}" stroke="#FFFFFF" stroke-width="5" paint-order="stroke">${line}</text>`,
    )
    .join("");
  return `${openArrow(x1, y1, x2, y2, null)}${texts}`;
}

const extensionSvg = svg(
  1180,
  640,
  [
    boundary(120, 16, 980, 470, "Banking App"),
    linkFromBelow(820, 560, profile),
    arrowToward(profileHelp, [700, 190], 530, 145, ["«extend»", "profile help"]),
    arrowToward(profilePrivacy, [700, 370], 520, 330, ["«extend»", "privacy information"]),
    useCase(profileHelp.cx, profileHelp.cy, profileHelp.rx, profileHelp.ry, "Go to Profile Help"),
    useCase(profilePrivacy.cx, profilePrivacy.cy, profilePrivacy.rx, profilePrivacy.ry, "Show Privacy Info"),
    profileCase(),
    actor(820, 560, ["Customer"]),
  ].join("\n"),
);

const exLogin = { cx: 500, cy: 280, rx: 78, ry: 34 };
const exPassword = { cx: 880, cy: 280, rx: 118, ry: 34 };
const exError = { cx: 500, cy: 130, rx: 124, ry: 34 };
const exPayment = { cx: 500, cy: 470, rx: 116, ry: 34 };
const exChecking = { cx: 500, cy: 630, rx: 124, ry: 34 };

const exerciseSvg = svg(
  1160,
  740,
  [
    boundary(170, 16, 920, 690, "Banking App"),
    linkActorToUse(68, 340, exLogin, false),
    linkActorToUse(68, 340, exPayment, false),
    arrowBetween(exError, exLogin, ["«extend»", "password is incorrect"], -120),
    arrowBetween(exLogin, exPassword, "«include»", -34),
    linkUses(exChecking, exPayment, exPayment, hollowTriangle),
    useCase(exError.cx, exError.cy, exError.rx, exError.ry, ["Display", "Login Error"]),
    useCase(exLogin.cx, exLogin.cy, exLogin.rx, exLogin.ry, "Log In"),
    useCase(exPassword.cx, exPassword.cy, exPassword.rx, exPassword.ry, "Verify Password"),
    useCase(exPayment.cx, exPayment.cy, exPayment.rx, exPayment.ry, "Make Payment"),
    useCase(exChecking.cx, exChecking.cy, exChecking.rx, exChecking.ry, "Pay from Checking"),
    actor(68, 340, ["Customer"]),
  ].join("\n"),
);

const files = {
  "01-boundary.svg": boundarySvg,
  "02-primary.svg": primarySvg,
  "03-goals.svg": goalsSvg,
  "05-include-shared.svg": sharedSvg,
  "06-extend.svg": extendSvg,
  "07-compare.svg": compareSvg,
  "10-extension-points.svg": extensionSvg,
  "11-complete.svg": completeSvg,
  "12-library.svg": librarySvg,
  "14-library-fixed.svg": libraryFixedSvg,
  "13-exercise.svg": exerciseSvg,
};

for (const [name, contents] of Object.entries(files)) {
  writeFileSync(join(outDir, name), contents);
  console.log(name);
}
