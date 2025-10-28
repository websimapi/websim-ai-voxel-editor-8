import * as THREE from 'three';

class UIManager {
    constructor(world) {
        this.world = world;
        this.promptInput = document.getElementById('texture-prompt');
        this.generateBtn = document.getElementById('generate-texture-btn');
        this.paletteContainer = document.getElementById('texture-palette');
        this.loader = document.getElementById('loader');

        this.saveNameInput = document.getElementById('save-name-input');
        this.saveBtn = document.getElementById('save-btn');
        this.loadBtn = document.getElementById('load-btn');
        this.loadMenu = document.getElementById('load-menu');
        this.loadMenuContent = document.getElementById('load-menu-content');

        this.materials = [];
        this.activeMaterial = null;
        this.saveManager = null;

        this.generateBtn.addEventListener('click', this.onGenerateClick.bind(this));
        this.saveBtn.addEventListener('click', this.onSaveClick.bind(this));
        this.loadBtn.addEventListener('click', this.toggleLoadMenu.bind(this));
        
        // this.loadInitialTexture(); // Moved to main.js to be awaited
    }

    setSaveManager(manager) {
        this.saveManager = manager;
    }

    async loadInitialTexture() {
        this.showLoader();
        const texture = await new THREE.TextureLoader().loadAsync('./default_texture.png');
        this.addTextureToPalette(texture, false);
        this.hideLoader();
    }

    onSaveClick() {
        const name = this.saveNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for your world.');
            return;
        }

        const saves = this.saveManager.getSaves();
        const existingSave = saves.named.find(save => save.name === name);

        if (existingSave) {
            if (confirm(`A world named "${name}" already exists. Do you want to overwrite it?`)) {
                this.saveManager.save(name);
                alert(`World "${name}" has been overwritten.`);
            }
        } else {
            this.saveManager.save(name);
            alert(`World saved as "${name}".`);
        }
    }

    toggleLoadMenu() {
        if (this.loadMenu.classList.contains('hidden')) {
            this.populateLoadMenu();
            this.loadMenu.classList.remove('hidden');
        } else {
            this.loadMenu.classList.add('hidden');
        }
    }

    populateLoadMenu() {
        const saves = this.saveManager.getSaves();
        this.loadMenuContent.innerHTML = ''; // Clear previous content

        let content = '';

        content += '<h3>Named Saves</h3>';
        content += '<ul id="named-saves-list">';
        if (saves.named.length > 0) {
            saves.named.forEach(save => {
                content += `<li data-key="${save.key}" data-name="${save.name}">${save.name}</li>`;
            });
        } else {
            content += '<li>No named saves yet.</li>';
        }
        content += '</ul>';

        content += '<h3>Backups</h3>';
        content += '<ul id="backup-saves-list">';
        if (saves.backups.length > 0) {
            saves.backups.forEach(save => {
                content += `<li data-key="${save.key}">${save.name}</li>`;
            });
        } else {
            content += '<li>No backups found.</li>';
        }
        content += '</ul>';

        this.loadMenuContent.innerHTML = content;

        // Add event listeners after populating
        this.loadMenuContent.querySelectorAll('#named-saves-list li').forEach(li => {
            if (li.dataset.key) {
                li.addEventListener('click', () => this.onLoadClick(li.dataset.key, li.dataset.name));
            }
        });
        this.loadMenuContent.querySelectorAll('#backup-saves-list li').forEach(li => {
            if (li.dataset.key) {
                li.addEventListener('click', () => this.onLoadClick(li.dataset.key));
            }
        });
    }

    async onLoadClick(saveKey, name = null) {
        if (this.saveManager.isDirty) {
            if (!confirm('You have unsaved changes. Are you sure you want to load a new world?')) {
                return;
            }
        }
        this.showLoader();
        await this.saveManager.load(saveKey);
        this.saveNameInput.value = name || '';
        this.loadMenu.classList.add('hidden');
        this.hideLoader();
    }

    async onGenerateClick() {
        const prompt = this.promptInput.value;
        if (!prompt) {
            alert('Please enter a prompt for the texture.');
            return;
        }

        this.showLoader();
        try {
            const fullPrompt = `8-bit retro pixel art, seamless, tileable texture, ${prompt}`;
            const result = await websim.imageGen({
                prompt: fullPrompt,
                aspect_ratio: "1:1"
            });
            const texture = await new THREE.TextureLoader().loadAsync(result.url);
            this.addTextureToPalette(texture);
        } catch (error) {
            console.error('Error generating texture:', error);
            alert('Failed to generate texture. Please try again.');
        } finally {
            this.hideLoader();
        }
    }

    addTextureToPalette(texture, markDirty = true) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const material = new THREE.MeshStandardMaterial({ map: texture });
        this.materials.push(material);

        const paletteItem = document.createElement('div');
        paletteItem.className = 'palette-item';
        paletteItem.style.backgroundImage = `url(${texture.image.src})`;
        paletteItem.addEventListener('click', () => {
            this.setActiveMaterial(material, paletteItem);
        });

        this.paletteContainer.appendChild(paletteItem);

        if (!this.activeMaterial) {
            this.setActiveMaterial(material, paletteItem);
        }

        if (markDirty && this.saveManager) {
            this.saveManager.setDirty();
        }
    }

    clearPalette() {
        this.paletteContainer.innerHTML = '';
        this.materials = [];
        this.activeMaterial = null;
    }

    setActiveMaterial(material, selectedItem) {
        this.activeMaterial = material;
        document.querySelectorAll('.palette-item').forEach(item => {
            item.classList.remove('selected');
        });
        selectedItem.classList.add('selected');
    }

    getActiveMaterial() {
        return this.activeMaterial;
    }

    showLoader() {
        this.loader.classList.remove('hidden');
        this.generateBtn.disabled = true;
    }

    hideLoader() {
        this.loader.classList.add('hidden');
        this.generateBtn.disabled = false;
    }
}

export default UIManager;