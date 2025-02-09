const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;

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
    window.output = await getOutput()
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
    document.getElementById("active-image-name").innerText = image_filename
    reloadActiveCategory()
}

function reloadActiveCategory() {
    document.querySelectorAll(".category-button").forEach(ele => {
        category = ele.getAttribute("data-category")
        if (window.output && window.activeImage) {
            if (window.output[window.activeImage] == category) {
                ele.classList.add("active")
            } else {
                ele.classList.remove("active")
            }
        }
    });
}

function reloadCategories() {
    const container = document.getElementById("categories")
    container.innerHTML = ""
    i = 0
    let categories = window.settings.categories[window.settings.input_path] // if there are categories for this input path, use those
    if (!categories) {
        categories = window.settings.categories[Object.keys(window.settings.categories)[Object.keys(window.settings.categories).length-1]]
    }
    window.settings.categories[window.settings.input_path] = categories
    saveSettings(window.settings)
    categories.forEach((category) => {
        i++
        ele = document.createElement("div")
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
    reloadActiveCategory()
}

function labelActiveImage(category) {
    if (!(window.activeImage)) return
    addToOutput(window.activeImage, category).then(() => {
        reloadImageDots(window.filenames)
        reloadActiveCategory()
    })
}

function reloadImageDots(filenames) {
    const container = document.getElementById("images-nav")
    container.innerHTML = ""
    filenames.forEach(filename => {
        ele = document.createElement("div")
        ele.appendChild(document.createElement("div"))
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

async function changeInputPath() {
    path = await open({
        multiple: false,
        directory: true,
    })
    window.settings.input_path = path
    saveSettings(window.settings)
    main()
}

function main() {
    window.output = getOutput()
    getImageFilenames().then((filenames) => {
        window.filenames = filenames
        reloadImageDots(filenames)
        changeActiveImage(filenames[0])
        reloadCategories()
    })
}

window.addEventListener("DOMContentLoaded", () => {
    window.settings = loadSettings().then(() => {
        main()
    })
});

document.getElementById("input-path-button").addEventListener("click", changeInputPath)
