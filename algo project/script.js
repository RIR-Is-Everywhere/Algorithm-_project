// Grid configuration
const ROWS = 15;
const COLS = 20;
const ANIMATION_SPEED = 20; // milliseconds

// Node types
const NODE_TYPES = {
    EMPTY: 'empty',
    WALL: 'wall',
    HOME: 'home',
    SCHOOL: 'school',
    VISITED: 'visited',
    PATH: 'path',
    CURRENT: 'current'
};

// Grid state
let grid = [];
let homePos = { row: 7, col: 1 };
let schoolPos = { row: 7, col: 18 };
let isRunning = false;

// Initialize the application
function init() {
    createGrid();
    setupEventListeners();
    resetGrid();
}

// Create the visual grid
function createGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell empty';
            cell.dataset.row = row;
            cell.dataset.col = col;
            gridElement.appendChild(cell);
        }
    }
}

// Setup event listeners for wall drawing and moving home/school
function setupEventListeners() {
    const gridElement = document.getElementById('grid');
    let isDrawing = false;
    let isDragging = false;
    let dragTarget = null;

    gridElement.addEventListener('mousedown', (e) => {
        if (isRunning) return;
        if (e.target.classList.contains('cell')) {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            // Check if clicking on home or school to start dragging
            if ((row === homePos.row && col === homePos.col)) {
                isDragging = true;
                dragTarget = 'home';
                e.target.style.opacity = '0.7';
                return;
            } else if ((row === schoolPos.row && col === schoolPos.col)) {
                isDragging = true;
                dragTarget = 'school';
                e.target.style.opacity = '0.7';
                return;
            }
            
            // Otherwise start drawing walls
            isDrawing = true;
            toggleWall(e.target);
        }
    });

    gridElement.addEventListener('mouseover', (e) => {
        if (isRunning) return;
        if (e.target.classList.contains('cell')) {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            if (isDragging && dragTarget) {
                // Show preview of where home/school will be placed
                if (!e.target.classList.contains('wall') && 
                    !(row === homePos.row && col === homePos.col) &&
                    !(row === schoolPos.row && col === schoolPos.col)) {
                        e.target.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.8)';
                }
            } else if (isDrawing) {
                toggleWall(e.target);
            }
        }
    });

    gridElement.addEventListener('mouseleave', (e) => {
        if (e.target.classList.contains('cell')) {
            e.target.style.boxShadow = '';
        }
    });

    gridElement.addEventListener('mouseup', (e) => {
        if (isDragging && dragTarget && e.target.classList.contains('cell')) {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            // Check if target cell is valid (not a wall and not occupied by other landmark)
            if (!e.target.classList.contains('wall') && 
                !(row === homePos.row && col === homePos.col) &&
                !(row === schoolPos.row && col === schoolPos.col)) {
                
                // Clear previous position
                if (dragTarget === 'home') {
                    grid[homePos.row][homePos.col] = NODE_TYPES.EMPTY;
                    homePos = { row, col };
                    grid[row][col] = NODE_TYPES.HOME;
                    updateStatus('🏠 Home moved to new location!');
                } else if (dragTarget === 'school') {
                    grid[schoolPos.row][schoolPos.col] = NODE_TYPES.EMPTY;
                    schoolPos = { row, col };
                    grid[row][col] = NODE_TYPES.SCHOOL;
                    updateStatus('🏫 School moved to new location!');
                }
                
                updateVisualGrid();
            }
        }
        
        // Reset states
        isDrawing = false;
        isDragging = false;
        dragTarget = null;
        
        // Reset all cell styles
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.opacity = '';
            cell.style.boxShadow = '';
        });
    });

    // Prevent context menu on right click
    gridElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Toggle wall on cell
function toggleWall(cellElement) {
    const row = parseInt(cellElement.dataset.row);
    const col = parseInt(cellElement.dataset.col);

    // Don't allow walls on home or school
    if ((row === homePos.row && col === homePos.col) || 
        (row === schoolPos.row && col === schoolPos.col)) {
        return;
    }

    const isWall = cellElement.classList.contains('wall');
    if (isWall) {
        cellElement.className = 'cell empty';
        grid[row][col] = NODE_TYPES.EMPTY;
    } else {
        cellElement.className = 'cell wall';
        grid[row][col] = NODE_TYPES.WALL;
    }
}

// Initialize grid state
function resetGrid() {
    if (isRunning) return;

    // Initialize grid array
    grid = [];
    for (let row = 0; row < ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < COLS; col++) {
            grid[row][col] = NODE_TYPES.EMPTY;
        }
    }

    // Set home and school positions
    grid[homePos.row][homePos.col] = NODE_TYPES.HOME;
    grid[schoolPos.row][schoolPos.col] = NODE_TYPES.SCHOOL;

    // Update visual grid
    updateVisualGrid();
    updateStatus('Grid reset. Click and drag to draw walls, then find the shortest path!');
    resetStats();
}

// Clear all walls
function clearWalls() {
    if (isRunning) return;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col] === NODE_TYPES.WALL) {
                grid[row][col] = NODE_TYPES.EMPTY;
            }
        }
    }

    updateVisualGrid();
    updateStatus('All walls cleared!');
}

// Generate random walls
function generateRandomWalls() {
    if (isRunning) return;

    clearWalls();

    // Add random walls (about 25% of empty cells)
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col] === NODE_TYPES.EMPTY && Math.random() < 0.25) {
                grid[row][col] = NODE_TYPES.WALL;
            }
        }
    }

    updateVisualGrid();
    updateStatus('Random walls generated!');
}

// Update visual representation of grid
function updateVisualGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const row = Math.floor(index / COLS);
        const col = index % COLS;
        const nodeType = grid[row][col];
        
        cell.className = `cell ${nodeType}`;
    });
}

// Get valid neighbors for a cell
function getNeighbors(row, col) {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right

    for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (newRow >= 0 && newRow < ROWS && 
            newCol >= 0 && newCol < COLS && 
            grid[newRow][newCol] !== NODE_TYPES.WALL) {
            neighbors.push({ row: newRow, col: newCol });
        }
    }

    return neighbors;
}

// Dijkstra's algorithm implementation
async function dijkstra(startRow, startCol, endRow, endCol) {
    const distances = {};
    const previous = {};
    const visited = new Set();
    const unvisited = [];

    // Initialize distances
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const key = `${row}-${col}`;
            distances[key] = Infinity;
            previous[key] = null;
            if (grid[row][col] !== NODE_TYPES.WALL) {
                unvisited.push({ row, col, distance: Infinity });
            }
        }
    }

    const startKey = `${startRow}-${startCol}`;
    distances[startKey] = 0;
    unvisited.find(node => node.row === startRow && node.col === startCol).distance = 0;

    let visitedCount = 0;

    while (unvisited.length > 0) {
        // Sort by distance and get the closest unvisited node
        unvisited.sort((a, b) => a.distance - b.distance);
        const current = unvisited.shift();

        if (current.distance === Infinity) {
            break; // No path exists
        }

        const currentKey = `${current.row}-${current.col}`;
        visited.add(currentKey);
        visitedCount++;

        // Visualize current node
        if (!(current.row === startRow && current.col === startCol) && 
            !(current.row === endRow && current.col === endCol)) {
            
            // Show as current node
            const cellIndex = current.row * COLS + current.col;
            const cell = document.querySelectorAll('.cell')[cellIndex];
            cell.className = 'cell current';
            
            await sleep(ANIMATION_SPEED);
            
            // Mark as visited
            cell.className = 'cell visited';
            grid[current.row][current.col] = NODE_TYPES.VISITED;
        }

        // Update stats in real-time
        document.getElementById('nodesVisited').textContent = visitedCount;

        // Check if we reached the destination
        if (current.row === endRow && current.col === endCol) {
            return { distances, previous, visitedCount };
        }

        // Check neighbors
        const neighbors = getNeighbors(current.row, current.col);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row}-${neighbor.col}`;
            
            if (visited.has(neighborKey)) continue;

            const tentativeDistance = distances[currentKey] + 1;
            
            if (tentativeDistance < distances[neighborKey]) {
                distances[neighborKey] = tentativeDistance;
                previous[neighborKey] = currentKey;
                
                // Update distance in unvisited array
                const unvisitedNode = unvisited.find(node => 
                    node.row === neighbor.row && node.col === neighbor.col);
                if (unvisitedNode) {
                    unvisitedNode.distance = tentativeDistance;
                }
            }
        }
    }

    return { distances, previous, visitedCount };
}

// Reconstruct and visualize the shortest path
async function reconstructPath(previous, startRow, startCol, endRow, endCol) {
    const path = [];
    let currentKey = `${endRow}-${endCol}`;

    while (currentKey !== null) {
        const [row, col] = currentKey.split('-').map(Number);
        path.unshift({ row, col });
        currentKey = previous[currentKey];
    }

    // Check if path exists
    if (path.length === 1) {
        return []; // No path found
    }

    // Animate the path
    for (let i = 1; i < path.length - 1; i++) {
        const { row, col } = path[i];
        const cellIndex = row * COLS + col;
        const cell = document.querySelectorAll('.cell')[cellIndex];
        cell.className = 'cell path';
        grid[row][col] = NODE_TYPES.PATH;
        await sleep(ANIMATION_SPEED * 2);
    }

    return path;
}

// Main pathfinding function
async function findPath() {
    if (isRunning) return;

    isRunning = true;
    const startTime = Date.now();
    updateStatus('🔍 Running Dijkstra\'s algorithm...', 'processing');

    try {
        // Clear previous results
        clearPreviousResults();

        // Run Dijkstra's algorithm
        const result = await dijkstra(homePos.row, homePos.col, schoolPos.row, schoolPos.col);
        const { distances, previous, visitedCount } = result;

        // Check if path exists
        const endKey = `${schoolPos.row}-${schoolPos.col}`;
        if (distances[endKey] === Infinity) {
            updateStatus('❌ No path found! Try removing some walls.', 'error');
            isRunning = false;
            return;
        }

        // Reconstruct and show the path
        const path = await reconstructPath(previous, homePos.row, homePos.col, schoolPos.row, schoolPos.col);
        
        const endTime = Date.now();
        const timeTaken = endTime - startTime;

        // Update stats
        document.getElementById('pathLength').textContent = path.length - 1;
        document.getElementById('nodesVisited').textContent = visitedCount;
        document.getElementById('timeTaken').textContent = `${timeTaken}ms`;

        updateStatus(`✅ Shortest path found! Distance: ${path.length - 1} steps`, 'success');

    } catch (error) {
        updateStatus('❌ An error occurred while finding the path.', 'error');
        console.error(error);
    }

    isRunning = false;
}

// Clear previous pathfinding results
function clearPreviousResults() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col] === NODE_TYPES.VISITED || grid[row][col] === NODE_TYPES.PATH) {
                grid[row][col] = NODE_TYPES.EMPTY;
            }
        }
    }

    // Reset home and school
    grid[homePos.row][homePos.col] = NODE_TYPES.HOME;
    grid[schoolPos.row][schoolPos.col] = NODE_TYPES.SCHOOL;

    updateVisualGrid();
    resetStats();
}

// Update status message
function updateStatus(message, type = '') {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
}

// Reset statistics
function resetStats() {
    document.getElementById('pathLength').textContent = '-';
    document.getElementById('nodesVisited').textContent = '-';
    document.getElementById('timeTaken').textContent = '-';
}

// Utility function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

