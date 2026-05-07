const webAppUrl = "https://script.google.com/macros/s/AKfycbz-hjZR4rpWEiMkwuSeeU_eZfo-xwBifjJYVP-qJM95GBU5sdlCepKC7eAqT-KBhL68rg/exec";

async function fetchData() {
    try {
        const response = await fetch(webAppUrl, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });

        const data = await response.json();
        
        // সামারি আপডেট
        document.getElementById('month-text').innerText = "Month: " + (data.summary.month || "N/A");
        document.getElementById('total-amt').innerText = "৳ " + (data.summary.totalAmount || "0");
        document.getElementById('total-exp').innerText = "৳ " + (data.summary.totalExpense || "0");

        // মেম্বার লিস্ট রেন্ডার
        const listBody = document.getElementById('member-list');
        listBody.innerHTML = ''; 

        data.members.forEach(member => {
            const row = `
                <tr>
                    <td class="fw-bold">${member.name}</td>
                    <td><span class="badge bg-primary px-3 py-2">৳ ${member.taka}</span></td>
                    <td><span class="badge bg-info text-dark px-3 py-2">${member.meal} Meals</span></td>
                    <td class="fw-bold text-success">৳ ${member.handcash}</td>
                </tr>
            `;
            listBody.innerHTML += row;
        });

        document.getElementById('loader').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('loader').innerHTML = `<div class="text-danger text-center">Failed to load data. Please <a href="javascript:location.reload()">retry</a>.</div>`;
    }
}

window.onload = fetchData;
