

window.addEventListener('DOMContentLoaded', variable_select);


const get_selected_value = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;



// Lista de regiones sin datos por nombre de profundidad
const regionsWithNoData = {
    "STA": [2, 8, 9, 12, 13, 15, 19, 20, 22],
    "MTA": [1, 2, 3, 5, 6, 7, 12, 15, 22],
    "OHC": [1, 2, 4, 6, 7, 8, 9, 12, 17, 18]

};

let depth; // Declaración global




function variable_select() {

    depth = get_selected_value("optionVar");
    const region = document.getElementById("region");
    if (!region) return;  // Evita errores si el elemento no existe
    region.innerHTML = "";
    // Resetear la variable de región seleccionada
    selectedRegion = "All Regions"; // Asegurar que la variable global se resetee

    resetRegionDropdown();
    
    if (data[depth]) {
        for (const regionKey of Object.keys(data[depth])) {
            if (!regionsWithNoData[depth] || !regionsWithNoData[depth].includes(parseInt(regionKey))) {
                var new_region = document.createElement("option");
                new_region.text = regionKey;
                region.appendChild(new_region);
            }
        }
    }

    // Forzar la actualización de la región seleccionada
    region.value = "All Regions"; 
    region.dispatchEvent(new Event("change")); // Forzar actualización del desplegable
    region_select(depth); // Llamar a la función que maneja la selección de región
}



const resetRegionDropdown = () => {
    const region = document.getElementById("region");
    if (!region.querySelector('option[value="All Regions"]')) {
        region.innerHTML = '<option value="All Regions" selected>All Regions</option>';
    }
    };

function region_select(depth) {
    depth = depth ?? get_selected_value("optionVar");

    // Limpiar capas solo si hay elementos
    if (map_circles.getLayers().length || map_text.getLayers().length) {
        map_circles.clearLayers();
        map_text.clearLayers();
    }

    if (depth === "Clear" || region.value === "All Regions") {
        map.fitBounds([[-50, 0], [50, 360]]);
    }

    if (depth === "Clear") return;

    if (region.value === "All Regions") {
        let layers = [];
        let markers = [];
        let regionsArray = Object.entries(data[depth]);

        function processBatch(index = 0, batchSize = 5) {
            let end = Math.min(index + batchSize, regionsArray.length);

            for (let i = index; i < end; i++) {
                let [regs, regionData] = regionsArray[i];
                let { coords, color, names, lab_coords } = regionData;

                coords.forEach(([lat, lon]) => {
                    layers.push(L.circle([lat, lon], { color, fillColor: color, radius: 8 }));
                });

                if (!regionsWithNoData[depth]?.includes(parseInt(regs))) {
                    let marker = L.marker(lab_coords, { opacity: 0.65 }).bindTooltip(names, { permanent: true, className: "labelss" });
                    marker.on("click", () => selectRegion(regs));
                    markers.push(marker);
                }
            }

            if (end < regionsArray.length) {
                setTimeout(() => processBatch(end, batchSize), 0);
            } else {
                requestAnimationFrame(() => {
                    map_circles.addLayer(L.featureGroup(layers));
                    map_text.addLayer(L.featureGroup(markers));
                });
            }
        }

        processBatch();
        return;
    }

    // Si se selecciona una región específica
    let regionData = data2[depth]?.[region.value];
    if (!regionData) return;

    let { coords, color } = regionData;
    let layers = coords.map(([lat, lon]) => L.circle([lat, lon], { color, fillColor: color, radius: 8 }));

    if (layers.length > 0) {
        requestAnimationFrame(() => map_circles.addLayer(L.featureGroup(layers)));
    }
    

    let minLat = Math.min(...coords.map(c => c[0])) - 20;
    let maxLat = Math.max(...coords.map(c => c[0])) + 20;
    let minLon = Math.min(...coords.map(c => c[1])) - 20;
    let maxLon = Math.max(...coords.map(c => c[1])) + 20;
    map.fitBounds([[minLat, minLon], [maxLat, maxLon]]);
}





// Función para seleccionar una región desde el mapa
function selectRegion(region) {
    const regionSelect = document.getElementById("region");
    regionSelect.value = region;
    depth = get_selected_value("optionVar");
    console.log(regionSelect.value);
    region_select(depth);
    toggleDownloadButton();

}


document.addEventListener('click', function (event) {
    if (event.target.matches('#dropdownMenu button')) {
        const option = event.target.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
        if (option) {
            downloadData(option);
        } else {
            console.error("Error: No se pudo extraer la opción.");
        }
    }
});

// Llamar a toggleDownloadButton cuando se carga la página para establecer el estado inicial
document.addEventListener('DOMContentLoaded', function () {
    toggleDownloadButton();
    document.getElementById('region').addEventListener('change', toggleDownloadButton);
    document.querySelectorAll('input[name="optionVar"]').forEach(function (radio) {
        radio.addEventListener('change', toggleDownloadButton);
    });
});


function toggleDownloadButton() {
    var selectedOcean = document.querySelector('input[name="optionVar"]:checked').value;
    var regionSelect = document.getElementById('region');
    var downloadButton = document.getElementById('downloadButton');
    var downloadMenu = document.getElementById('downloadMenu');
    var dropdownMenu = document.getElementById('dropdownMenu');

    console.log(selectedOcean);
    console.log(regionSelect.value);
    if (selectedOcean === 'Clear') {
        // Oculta el botón de descarga
        downloadMenu.style.display = 'none';
        downloadButton.style.display = 'none';
        // Deshabilita el selector de regiones o lo limpia
        regionSelect.value = ''; // Limpia la selección
        regionSelect.disabled = true; // Deshabilita el selector

    } else {
        // Habilita el selector de regiones
        regionSelect.disabled = false;

        // Muestra el botón de descarga si se ha seleccionado una región válida
        var selectedRegion = regionSelect.value;
        if (selectedRegion == 'All Regions' || selectedRegion == '') {
            downloadMenu.style.display = 'none';
            downloadButton.style.display = 'none';
            

        }
        else {
            downloadMenu.style.display = 'block';
            downloadButton.style.display = 'flex';
            dropdownMenu.style.display = 'none';

        }

    }
}

// Función para alternar la visibilidad del menú desplegable
function toggleMenu() {
    var dropdownMenu = document.getElementById('dropdownMenu');

    // Si el menú está oculto, lo mostramos, y si está visible, lo ocultamos
    if (dropdownMenu.style.display === "none" || dropdownMenu.style.display === "") {
        dropdownMenu.style.display = "flex";  // Mostrar el menú
    } else {
        dropdownMenu.style.display = "none";  // Ocultar el menú
    }


}


// Llama a downloadData desde el menú desplegable
document.querySelectorAll('#downloadMenu button').forEach(function (menuItem) {
    menuItem.addEventListener('click', function () {
        const option = this.getAttribute("onclick").match(/'([^']+)'/)[1]; // Extrae la opción del `onclick`
    });
});

document.querySelectorAll('#dropdownMenu button').forEach(function (menuItem) {
    menuItem.addEventListener('click', function () {
        const option = this.getAttribute("onclick").match(/'([^']+)'/)[1]; // Extrae la opción del `onclick`

    });
});
async function downloadDataMask(type) {
    const fileName = `${type}_cluster_map.nc`;
    const filePathmask = `data/${fileName}`;
    console.log(filePathmask);

    try {
        // Verifica que el archivo exista antes de iniciar la descarga
        const response = await fetch(filePathmask);

        if (!response.ok) {
            throw new Error('Not found.');
        }

        alert(`Downloading: ${fileName}`);

        const blob = await response.blob();

        // Crea un enlace temporal para descargar el archivo
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.href = window.URL.createObjectURL(blob);
        downloadAnchorNode.setAttribute('download', fileName);
        document.body.appendChild(downloadAnchorNode);

        downloadAnchorNode.click();

        // Limpia el objeto URL y elimina el enlace temporal
        window.URL.revokeObjectURL(downloadAnchorNode.href);
        downloadAnchorNode.remove();
    } catch (error) {
        console.error('Error:', error);
        alert('Data not available.');
    }
}

async function downloadData(option) {
    const selectedOcean = document.querySelector('input[name="optionVar"]:checked').value;
    const selectedRegion = document.getElementById('region').value;
    const rn = data[selectedOcean][selectedRegion].rn;
    const cluster = rn + 1;

    // Construye la ruta del archivo en función de las selecciones
    const fileName = `${selectedOcean}_${cluster}_${option}.nc`;
    const filePath = `data/${fileName}`;

    // Nombre de archivo para la descarga
    const sanitize = (str) => str.replace(/\s+/g, "_");
    const sanitizedRegion = sanitize(selectedRegion);
    const sanitizedOcean = sanitize(selectedOcean);
    
    const newFileName = `${option}_${sanitizedRegion}_${sanitizedOcean}.nc`;

    try {
        // Verifica que el archivo exista antes de iniciar la descarga
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error('Not found.');
        }

        const blob = await response.blob();

        // Crea un enlace temporal para descargar el archivo
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.href = window.URL.createObjectURL(blob);
        downloadAnchorNode.setAttribute('download', newFileName);
        document.body.appendChild(downloadAnchorNode);

        downloadAnchorNode.click();

        // Limpia el objeto URL y elimina el enlace temporal
        window.URL.revokeObjectURL(downloadAnchorNode.href);
        downloadAnchorNode.remove();
    } catch (error) {
        console.error('Error:', error);
        alert('Data not avaliable.');
    }
}




// Función para descargar los datos
function downloadOption(option) {
    const selectedOcean = document.querySelector('input[name="optionVar"]:checked').value;
    const selectedRegion = document.getElementById("region").value;

    const sanitizedRegion = selectedRegion.replace(/\s+/g, "_");
    const sanitizedOcean = selectedOcean.replace(/\s+/g, "_");

    // Validar la selección antes de proceder
    if (!selectedOcean || selectedOcean === "Clear" || !selectedRegion || selectedRegion === "All Regions") {
        alert("Por favor, selecciona un océano y una región válida.");
        return;
    }

    //  console.log(`Downloading ${option} for the region: ${selectedRegion} and clustering analysis: ${selectedOcean}`);
    alert(`Downlading: ${option}_${sanitizedRegion}_${sanitizedOcean}.nc`);
}


// Ejemplo de funciones para descargar datos (puedes personalizar estas funciones si necesitas diferentes comportamientos)
function downloadData1() {
    downloadData("PC1");
}

function downloadData2() {
    downloadData("RSL");
}

function downloadData3() {
    downloadData("CSL");
}
function downloadData4() {
    downloadData("RC");
}




