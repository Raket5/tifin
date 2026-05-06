// আপনার Google Apps Script-এর Web App URL
const webAppUrl = "https://script.google.com/macros/s/AKfycbz-hjZR4rpWEiMkwuSeeU_eZfo-xwBifjJYVP-qJM95GBU5sdlCepKC7eAqT-KBhL68rg/exec";

/**
 * গুগল শিট থেকে ডাটা ফেচ করার মূল ফাংশন
 */
async function fetchData() {
    try {
        const response = await fetch(webAppUrl, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error('নেটওয়ার্ক রেসপন্স ঠিক নেই।');
        }
        
        const data = await response.json();
        
        // UI আপডেট শুরু
        updateDashboard(data.summary);
        renderMemberList(data.members);

        // লোডার বন্ধ করে মেইন কন্টেন্ট দেখানো
        document.getElementById('loader').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';

    } catch (error) {
        console.error("ডাটা লোড করতে সমস্যা হয়েছে:", error);
        document.getElementById('loader').innerHTML = `
            <div class="text-danger p-3 text-center">
                <p class="fw-bold">ডাটা লোড করতে সমস্যা হচ্ছে!</p>
                <small>${error.message}</small><br>
                <button class="btn btn-sm btn-success mt-3" onclick="location.reload()">আবার চেষ্টা করুন</button>
            </div>`;
    }
}

/**
 * ওপরের সামারি কার্ডগুলো আপডেট করার জন্য
 */
function updateDashboard(summary) {
    document.getElementById('month-text').innerText = "Month: " + (summary.month || "N/A");
    document.getElementById('total-amt').innerText = "৳ " + (summary.totalAmount || 0);
    document.getElementById('total-exp').innerText = "৳ " + (summary.totalExpense || 0);
}

/**
 * মেম্বারদের লিস্ট টেবিলে দেখানোর জন্য
 */
function renderMemberList(members) {
    const listBody = document.getElementById('member-list');
    listBody.innerHTML = ''; // আগের ডাটা পরিষ্কার করা

    members.forEach(member => {
        const row = `
            <tr>
                <td class="fw-bold text-dark">${member.name}</td>
                <td><span class="badge bg-primary px-2 py-2">৳ ${member.taka}</span></td>
                <td><span class="badge bg-info text-dark px-2 py-2">${member.meal} Meals</span></td>
                <td class="fw-bold text-success">৳ ${member.handcash}</td>
            </tr>
        `;
        listBody.innerHTML += row;
    });
}

// পেজ লোড হওয়ার সাথে সাথে ডাটা আনা শুরু হবে
window.onload = fetchData;
