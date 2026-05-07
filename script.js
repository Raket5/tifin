// Web App URL-ti boshon
const webAppUrl = "https://script.google.com/macros/s/AKfycbz-hjZR4rpWEiMkwuSeeU_eZfo-xwBifjJYVP-qJM95GBU5sdlCepKC7eAqT-KBhL68rg/exec";

async function fetchData() {
    try {
        const response = await fetch(webAppUrl);
        const data = await response.json();
        
        // Summary update
        document.getElementById('month-text').innerText = "Month: " + data.summary.month;
        document.getElementById('total-amt').innerText = "৳ " + data.summary.totalAmount;
        document.getElementById('total-exp').innerText = "৳ " + data.summary.totalExpense;

        const listBody = document.getElementById('member-list');
        listBody.innerHTML = ''; 

        data.members.forEach(member => {
            // "member.handcash" ekhon spreadsheet theke data pabe
            const row = `
                <tr>
                    <td class="fw-bold text-dark">${member.name}</td>
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
    }
}

window.onload = fetchData;
