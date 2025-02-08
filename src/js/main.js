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

function changeActiveImage(image_filename) {
    window.activeImage = image_filename
    displayImage(image_filename)
    dotEle = document.querySelector(`.dot[data-filename='${image_filename}']`)
    dotEle.classList.add("active")
}

window.addEventListener("DOMContentLoaded", () => {
    window.settings = loadSettings().then(() => {
        getImageFilenames().then((filenames) => {
            const container = document.getElementById("images-nav")
            filenames.forEach(filename => {
                ele = document.createElement("div")
                ele.classList.add("dot")
                ele.setAttribute("data-filename", filename)
                container.appendChild(ele)
            });
            changeActiveImage(filenames[0])
        })
    })
});
