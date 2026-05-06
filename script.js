/**
 * BN Tiffin Management - script.js
 * এই ফাইলটি আপনার Google Sheet (calculation ট্যাব) থেকে ডাটা নিয়ে এসে 
 * ওয়েব পেজের ড্যাশবোর্ড এবং মেম্বার লিস্ট আপডেট করবে।
 */

// আপনার সঠিক Web App URL (Deploy করার পর প্রাপ্ত লিঙ্ক)
const webAppUrl = "https://script.google.com/macros/s/AKfycbz-hjZR4rpWEiMkwuSeeU_eZfo-xwBifjJYVP-qJM95GBU5sdlCepKC7eAqT-KBhL68rg/exec";

/**
 * ডাটাবেজ থেকে ডাটা ফেচ করার প্রধান ফাংশন
 */
async function fetchData() {
    try {
        const response = await fetch(webAppUrl, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error('নেটওয়ার্ক থেকে ডাটা পেতে সমস্যা হচ্ছে।');
        }
        
        const data = await response.json();
        
        // ড্যাশবোর্ড এবং টেবিল রেন্ডার করা শুরু
        updateDashboard(data.summary);
        renderTable(data.members);

        // লোডার বন্ধ করে মেইন কন্টেন্ট প্রদর্শন
        document.getElementById('loader').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';

    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('loader').innerHTML = `
            <div class="text-danger p-3 text-center">
                <p class="fw-bold">ডাটা লোড করতে ব্যর্থ হয়েছে!</p>
                <p><small>${error.message}</small></p>
                <button class="btn btn-sm btn-outline-success mt-2" onclick="location.reload()">আবার চেষ্টা করুন</button>
            </div>`;
    }
}

/**
 * ওপরের সামারি কার্ড এবং মাসের নাম আপডেট করার জন্য
 * @param {Object} summary 
 */
function updateDashboard(summary) {
    // মাস সেট করা (Row 17, Col B)
    document.getElementById('month-text').innerText = "Month: " + (summary.month || "N/A");
    
    // টোটাল এমাউন্ট সেট করা (Row 15, Col B)
    document.getElementById('total-amt').innerText = "৳ " + (summary.totalAmount || 0);
    
    // টোটাল খরচ সেট করা (Row 16, Col B)
    document.getElementById('total-exp').innerText = "৳ " + (summary.totalExpense || 0);
}

/**
 * মেম্বারদের ডাটা টেবিলে ইনজেক্ট করার জন্য
 * @param {Array} members 
 */
function renderTable(members) {
    const listBody = document.getElementById('member-list');
    listBody.innerHTML = ''; // আগের কোনো ডাটা থাকলে তা পরিষ্কার করা

    members.forEach(member => {
        // আপনার শিটের ডাটা অনুযায়ী প্রতিটি মেম্বারের জন্য একটি রো তৈরি
        const row = `
            <tr>
                <td class="fw-bold text-dark">${member.name}</td>
                <td><span class="badge bg-primary px-3 py-2 shadow-sm">৳ ${member.taka}</span></td>
                <td><span class="badge bg-info text-dark px-3 py-2 shadow-sm">${member.meal} Meals</span></td>
                <td class="fw-bold text-success">৳ ${member.handcash}</td>
            </tr>
        `;
        listBody.innerHTML += row;
    });
}

// পেজটি সম্পূর্ণ লোড হওয়ার পর ডাটা আনা শুরু হবে
window.onload = fetchData;
