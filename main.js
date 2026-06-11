let allData = [];

        // ✅ preview รูปทั้งหมด
        function upload() {
            const files = document.getElementById("fileInput").files;
            const container = document.getElementById("previewContainer");

            container.innerHTML = "";

            if (!files.length) {
                document.getElementById("result2").innerText = "ยังไม่ได้เลือกไฟล์";
                return;
            }

            document.getElementById("result2").innerText =
                `เลือก ${files.length} ไฟล์`;

            for (let file of files) {

                const reader = new FileReader();

                reader.onload = function (e) {

                    const div = document.createElement("div");
                    div.className = "previewBox";

                    div.innerHTML = `
    <img src="${e.target.result}">
    <p>${file.name}</p>
`;

                    container.appendChild(div);
                };

                reader.readAsDataURL(file);
            }
        }


        // ✅ OCR
        async function runBatchOCR() {

            const files = document.getElementById("fileInput").files;
            if (!files.length) return alert("เลือกไฟล์ก่อน");

            allData = [];

            for (let i = 0; i < files.length; i++) {

                const file = files[i];

                document.getElementById("status").innerText =
                    `กำลัง OCR: ${file.name} (${i + 1}/${files.length})`;

                const { data } = await Tesseract.recognize(file, 'tha+eng');

                const clean = extractData(data.text);

                allData.push({
                    file: file.name,
                    ...clean
                });
            }

            document.getElementById("status").innerText = "✅ เสร็จแล้ว";

            document.getElementById("result").value =
                JSON.stringify(allData, null, 2);
        }


        // ✅ Extract
        function extractData(text) {

            const lines = text.split("\n")
                .map(l => l.trim())
                .filter(l => l);

            let branch = "";
            let items = [];
            let total = 0;

            for (let line of lines) {

                if (line.includes("สาขา")) {
                    branch = line.split("สาขา").pop().trim();
                }

                if (line.includes("รวม")) {
                    const t = line.match(/(\d+\.\d{2})/);
                    if (t) total = parseFloat(t[1]);
                }

                let m =
                    line.match(/(.+?)\s+(\d+\.\d{2})\s+(\d+\.\d{2})/) ||
                    line.match(/(.+?)\s+(\d+\.\d{2})/);

                if (m) {
                    let name = m[1].trim();
                    let price = parseFloat(m[2]);
                    let sum = m[3] ? parseFloat(m[3]) : price;

                    if (
                        name.length > 5 &&
                        !name.includes("VAT") &&
                        price > 5 &&
                        price < 10000
                    ) {
                        items.push({ name, price, total: sum });
                    }
                }
            }

            return { branch, items, total };
        }


        // ✅ JSON
        function exportJSON() {
            const blob = new Blob(
                [JSON.stringify(allData, null, 2)],
                { type: "application/json" }
            );

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "ocr_data.json";
            a.click();
        }


        // ✅ Excel
        function exportExcel() {

            let rows = [];

            allData.forEach(bill => {
                bill.items.forEach(item => {
                    rows.push({
                        ไฟล์: bill.file,
                        สาขา: bill.branch,
                        สินค้า: item.name,
                        ราคา: item.price,
                        รวมสินค้า: item.total,
                        ยอดรวมบิล: bill.total
                    });
                });
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(wb, ws, "OCR");

            XLSX.writeFile(wb, "ocr_data.xlsx");
        }
        function upload() {
            const files = document.getElementById("fileInput").files;
            const container = document.getElementById("previewContainer");

            container.innerHTML = "";

            for (let file of files) {

                const reader = new FileReader();

                reader.onload = function (e) {

                    const div = document.createElement("div");
                    div.className = "previewBox";

                    div.innerHTML = `
                <img src="${e.target.result}" onclick="openModal(this)">
                <p>${file.name}</p>
            `;

                    container.appendChild(div);
                };

                reader.readAsDataURL(file);
            }
        }

        let scale = 1;
        let posX = 0;
        let posY = 0;
        let isDragging = false;
        let startX, startY;

        const modal = document.getElementById("imgModal");
        const img = document.getElementById("zoomImage");

        // ✅ เปิดภาพ
        function openModal(el) {
            modal.style.display = "block";
            img.src = el.src;

            scale = 1;
            posX = 0;
            posY = 0;
            updateTransform();
        }

        // ✅ ปิดภาพ
        function closeModal() {
            modal.style.display = "none";
        }

        // ✅ zoom ด้วย scroll
        modal.addEventListener("wheel", (e) => {
            e.preventDefault();

            scale += e.deltaY * -0.001;

            scale = Math.min(Math.max(0.5, scale), 5);

            updateTransform();
        });

        // ✅ drag
        img.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.clientX - posX;
            startY = e.clientY - posY;
            img.style.cursor = "grabbing";
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            posX = e.clientX - startX;
            posY = e.clientY - startY;

            updateTransform();
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
            img.style.cursor = "grab";
        });

        // ✅ apply transform
        function updateTransform() {
            img.style.transform =
                `translate(${posX}px, ${posY}px) scale(${scale})`;
        }
        
        