// Web App URL-ti boshon
const webAppUrl = "https://script.google.com/macros/s/AKfycbwCCDwFojPH2RGGOQBL_lE8RdMkXTO6WkFGOKYnunKtAl5c1XLXqqQ4jj6RF71tGwUx6Q/exec";

async function fetchData() {
    try {
        // Show loader
        document.getElementById('loader').style.display = 'flex';
        document.getElementById('main-content').style.display = 'none';
        
        const response = await fetch(webAppUrl);
        const data = await response.json();
        
        console.log("Full response:", data); // Debug - browser console e dekhen
        
        // Check for error
        if (data.error) {
            console.error("Server error:", data.error);
            document.getElementById('month-text').innerText = "Month: Error loading data";
            document.getElementById('loader').innerHTML = '<div class="alert alert-danger">Error loading data. Please check console.</div>';
            return;
        }
        
        // Summary update - ensure numbers are displayed properly
        document.getElementById('month-text').innerText = "Month: " + (data.summary.month || "N/A");
        document.getElementById('total-amt').innerHTML = "৳ " + (Number(data.summary.totalAmount).toFixed(2) || "0");
        document.getElementById('total-exp').innerHTML = "৳ " + (Number(data.summary.totalExpense).toFixed(2) || "0");

        const listBody = document.getElementById('member-list');
        listBody.innerHTML = ''; 

        if (!data.members || data.members.length === 0) {
            listBody.innerHTML = '<tr><td colspan="4" class="text-center">No data found</td></tr>';
        } else {
            data.members.forEach(member => {
                console.log(`Member: ${member.name}, Meal: ${member.meal}, Handcash: ${member.handcash}`); // Debug
                
                const row = `
                    <tr>
                        <td class="fw-bold text-dark">${member.name || ''}</td>
                        <td><span class="badge bg-primary px-3 py-2">৳ ${Number(member.taka).toFixed(2)}</span></td>
                        <td><span class="badge bg-info text-dark px-3 py-2">${Number(member.meal)} Meals</span></td>
                        <td class="fw-bold text-success">৳ ${Number(member.handcash).toFixed(2)}</td>
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
