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

async function getOutput() {
    output = await invoke("get_output", {"inputPath":window.settings.input_path, "outputFileName": window.settings.output_file_name})
    return output
}

async function addToOutput(imageFilename, category) {
    await invoke("add_to_output", {
        "inputPath":window.settings.input_path, "outputFileName": window.settings.output_file_name,
        "imageFilename":imageFilename, "category":category
    })
    window.output = getOutput()
}

function displayImage(image_filename) {
    getImage(image_filename).then((img) => {
        document.getElementById("main-image").setAttribute("src", img)
    })
}

function changeActiveImage(image_filename) {
    window.activeImage = image_filename
    displayImage(image_filename)
    document.querySelectorAll(".dot").forEach((ele) => {
        ele.classList.remove("active")
    })
    dotEle = document.querySelector(`.dot[data-filename='${image_filename}']`)
    dotEle.classList.add("active")
}

function reloadCategories() {
    const container = document.getElementById("categories")
    container.innerHTML = ""
    i = 0
    window.settings.categories.forEach((category) => {
        i++
        ele = document.createElement("div")
        if (window.output && window.activeImage) {
            if (window.output[window.activeImage] == category) {
                ele.classList.add("active")
            }
        }
        ele.classList.add("category-button")
        ele.innerText = category + ` (${i})`
        container.appendChild(ele)
        ele.addEventListener("click", () => {
            labelActiveImage(category)
        })
        ele.setAttribute("data-key", i)
        ele.setAttribute("data-category", category)
        document.addEventListener("keypress", (e) => {
            document.querySelectorAll(".category-button").forEach((buttonEle) => {
                key = buttonEle.getAttribute("data-key")
                if (key==e.key) {
                    labelActiveImage(buttonEle.getAttribute("data-category"))
                }
            })
        })
    })
}

function labelActiveImage(category) {
    if (!(window.activeImage)) return
    addToOutput(window.activeImage, category)
    reloadImageDots(window.filenames)
    reloadCategories()
}

function reloadImageDots(filenames) {
    const container = document.getElementById("images-nav")
    container.innerHTML = ""
    filenames.forEach(filename => {
        ele = document.createElement("div")
        ele.classList.add("dot")
        ele.setAttribute("data-filename", filename)
        container.appendChild(ele)
        ele.addEventListener("click", () => {
            changeActiveImage(filename)
        })
        if (window.output[filename]) {
            ele.classList.add("labeled")
        }
        if (window.activeImage == filename) {
            ele.classList.add("active")
        }
    });
}

window.addEventListener("DOMContentLoaded", () => {
    window.settings = loadSettings().then(() => {
        window.output = getOutput()
        getImageFilenames().then((filenames) => {
            window.filenames = filenames
            reloadImageDots(filenames)
            changeActiveImage(filenames[0])
            reloadCategories()
        })
    })
});
