// Web App URL-ti boshon
const webAppUrl = "https://script.google.com/macros/s/AKfycbz-hjZR4rpWEiMkwuSeeU_eZfo-xwBifjJYVP-qJM95GBU5sdlCepKC7eAqT-KBhL68rg/exec";

async function fetchData() {
    try {
        const response = await fetch(webAppUrl);
        const data = await response.json();
        
        console.log("Full response:", data); // Debug log
        
        // Check for error
        if (data.error) {
            console.error("Server error:", data.error);
            document.getElementById('month-text').innerText = "Month: Error loading data";
            document.getElementById('loader').innerHTML = '<div class="alert alert-danger">Error loading data. Please check console.</div>';
            return;
        }
        
        // Summary update dengan parsing number
        document.getElementById('month-text').innerText = "Month: " + (data.summary.month || "N/A");
        document.getElementById('total-amt').innerText = "৳ " + (Number(data.summary.totalAmount) || 0);
        document.getElementById('total-exp').innerText = "৳ " + (Number(data.summary.totalExpense) || 0);

        const listBody = document.getElementById('member-list');
        listBody.innerHTML = ''; 

        if (!data.members || data.members.length === 0) {
            listBody.innerHTML = '<tr><td colspan="4" class="text-center">No data found</td></tr>';
        } else {
            data.members.forEach(member => {
                const row = `
                    <tr>
                        <td class="fw-bold text-dark">${member.name || ''}</td>
                        <td><span class="badge bg-primary px-3 py-2">৳ ${Number(member.taka) || 0}</span></td>
                        <td><span class="badge bg-info text-dark px-3 py-2">${Number(member.meal) || 0} Meals</span></td>
                        <td class="fw-bold text-success">৳ ${Number(member.handcash) || 0}</td>
                    </tr>
                `;
                listBody.innerHTML += row;
            });
        }

        document.getElementById('loader').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('loader').innerHTML = '<div class="alert alert-danger">Failed to load data: ' + error.message + '</div>';
    }
}

window.onload = fetchData;
