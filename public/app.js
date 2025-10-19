const MATERIAL_COSTS = {
    brick: { base: 65000, insulation: 2500 },
    wood: { base: 58000, insulation: 1800 },
    frame: { base: 52000, insulation: 2200 },
    aerated: { base: 54000, insulation: 2100 },
};

const FINISH_MULTIPLIER = {
    basic: 1,
    standard: 1.18,
    premium: 1.35,
};

const EXTRA_COST = {
    garage: 1200000,
    terrace: 450000,
    solar: 950000,
};

const rooms = [];

const formatCurrency = (value) =>
    new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
    }).format(value);

const updateCostResult = (value, hint) => {
    const result = document.querySelector("#cost-result .value");
    const hintElement = document.querySelector("#cost-result .hint");
    result.textContent = value;
    hintElement.textContent = hint;
};

const calculateCost = (event) => {
    event.preventDefault();

    const area = Number(document.getElementById("floor-area").value);
    const floors = Number(document.getElementById("floors").value);
    const material = document.getElementById("material").value;
    const finish = document.getElementById("finish").value;
    const selectedExtras = Array.from(
        document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')
    ).map((item) => item.value);

    if (!area || !floors) {
        updateCostResult("—", "Укажите корректные параметры");
        return;
    }

    const materialCost = MATERIAL_COSTS[material]?.base ?? MATERIAL_COSTS.brick.base;
    const insulationCost = MATERIAL_COSTS[material]?.insulation ?? 0;
    const finishMultiplier = FINISH_MULTIPLIER[finish] ?? 1;

    const base = area * floors * materialCost;
    const insulation = area * insulationCost;
    const extras = selectedExtras.reduce((sum, key) => sum + (EXTRA_COST[key] ?? 0), 0);
    const total = Math.round((base + insulation + extras) * finishMultiplier);

    updateCostResult(formatCurrency(total), "Предварительная оценка, не включает инженерные сети");
};

const addRoom = (event) => {
    event.preventDefault();

    const name = document.getElementById("room-name").value.trim();
    const width = Number(document.getElementById("room-width").value);
    const length = Number(document.getElementById("room-length").value);

    if (!name || width <= 0 || length <= 0) {
        return;
    }

    const area = Number((width * length).toFixed(1));
    rooms.push({ name, width, length, area });

    document.getElementById("room-form").reset();
    document.getElementById("room-width").value = 5;
    document.getElementById("room-length").value = 6;

    renderRooms();
};

const renderRooms = () => {
    const list = document.getElementById("room-list");
    const layoutGrid = document.getElementById("layout-grid");
    const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);
    document.getElementById("total-area").textContent = totalArea.toFixed(1);

    list.innerHTML = "";
    layoutGrid.innerHTML = "";

    if (rooms.length === 0) {
        const placeholder = document.createElement("li");
        placeholder.textContent = "Добавьте помещения, чтобы увидеть планировку";
        placeholder.style.color = "var(--muted)";
        list.appendChild(placeholder);
        return;
    }

    rooms.forEach((room, index) => {
        const item = document.createElement("li");
        item.innerHTML = `
            <span>${index + 1}. ${room.name}</span>
            <span>${room.width}×${room.length} м · ${room.area} м²</span>
        `;
        list.appendChild(item);

        const cell = document.createElement("div");
        cell.className = "layout-cell";
        cell.innerHTML = `
            <strong>${room.name}</strong>
            <span>${room.width} × ${room.length} м</span>
            <span>${room.area} м²</span>
        `;
        layoutGrid.appendChild(cell);
    });
};

const init = () => {
    document.getElementById("cost-form").addEventListener("submit", calculateCost);
    document.getElementById("room-form").addEventListener("submit", addRoom);
    renderRooms();
};

document.addEventListener("DOMContentLoaded", init);
