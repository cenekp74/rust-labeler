const { invoke } = window.__TAURI__.core;

async function loadSettings() {
    settings = await invoke("load_settings");
    return settings
}

async function saveSettings(settings) {
    await invoke("save_settings", {settings});
}

async function getImage(image_filename) {
    image = await invoke("get_image", {"imagePath":window.settings.input_path+"/"+image_filename})
    return image
}

async function getImageFilenames() {
    filenames = await invoke("get_image_filenames", {"inputPath":window.settings.input_path});
    return filenames
}

function displayImage(image_filename) {
    getImage(image_filename).then((img) => {
        document.getElementById("main-image").setAttribute("src", img)
    })
}

window.addEventListener("DOMContentLoaded", () => {
    window.settings = loadSettings().then(() => {
        getImageFilenames().then((filenames) => {
            
        })
    })
});
