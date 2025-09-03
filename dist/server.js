"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
// Middleware
app.use(express_1.default.json());
// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Root route
app.get('/', (_req, res) => {
    res.send('Hello from TypeScript + Express!');
});
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map