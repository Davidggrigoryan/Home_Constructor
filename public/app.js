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
const projectFiles = [];

const formatCurrency = (value) =>
    new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
    }).format(value);

const formatSize = (bytes) => {
    if (!Number.isFinite(bytes)) {
        return "";
    }

    const units = ["Б", "КБ", "МБ", "ГБ"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

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

const closePreview = () => {
    const overlay = document.getElementById("preview-overlay");
    const content = document.getElementById("preview-content");

    if (!overlay || overlay.hasAttribute("hidden")) {
        return;
    }

    overlay.setAttribute("hidden", "");
    content.innerHTML = "";
};

const openPreview = (entry) => {
    const overlay = document.getElementById("preview-overlay");
    const title = document.getElementById("preview-title");
    const content = document.getElementById("preview-content");
    const closeButton = overlay.querySelector(".preview-close");

    title.textContent = entry.file.name;
    content.innerHTML = "";

    if (entry.file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = entry.url;
        img.alt = entry.file.name;
        content.appendChild(img);
    } else if (entry.file.type === "application/pdf") {
        const frame = document.createElement("iframe");
        frame.src = entry.url;
        frame.title = entry.file.name;
        content.appendChild(frame);
    } else {
        const unsupported = document.createElement("div");
        unsupported.className = "unsupported";
        unsupported.innerHTML = `
            <p>Предпросмотр для данного типа файла не поддерживается.</p>
            <p><a href="${entry.url}" download="${entry.file.name}">Скачать ${entry.file.name}</a></p>
        `;
        content.appendChild(unsupported);
    }

    overlay.removeAttribute("hidden");

    if (closeButton) {
        closeButton.focus();
    }
};

const renderFiles = () => {
    const list = document.getElementById("file-list");
    list.innerHTML = "";

    if (!projectFiles.length) {
        const placeholder = document.createElement("li");
        placeholder.className = "empty";
        placeholder.textContent = "Файлы ещё не добавлены";
        list.appendChild(placeholder);
        return;
    }

    projectFiles.forEach((entry) => {
        const item = document.createElement("li");
        item.innerHTML = `
            <span>${entry.file.name}</span>
            <small>${formatSize(entry.file.size)}</small>
        `;
        item.title = "Открыть предпросмотр двойным кликом";
        item.tabIndex = 0;
        item.addEventListener("dblclick", () => openPreview(entry));
        item.addEventListener("keydown", (event) => {
            if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
                event.preventDefault();
                openPreview(entry);
            }
        });
        list.appendChild(item);
    });
};

const handleFileInput = (event) => {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
        return;
    }

    files.forEach((file) => {
        const url = URL.createObjectURL(file);
        projectFiles.push({ file, url });
    });

    event.target.value = "";
    renderFiles();
};

const setupPreviewControls = () => {
    const overlay = document.getElementById("preview-overlay");

    if (!overlay) {
        return;
    }

    const closeButton = overlay.querySelector(".preview-close");

    if (!closeButton) {
        return;
    }

    closeButton.addEventListener("click", closePreview);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closePreview();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.hasAttribute("hidden")) {
            closePreview();
        }
    });
};

const init = () => {
    document.getElementById("cost-form").addEventListener("submit", calculateCost);
    document.getElementById("room-form").addEventListener("submit", addRoom);
    document.getElementById("project-files").addEventListener("change", handleFileInput);
    setupPreviewControls();
    renderRooms();
    renderFiles();
};

document.addEventListener("DOMContentLoaded", init);
