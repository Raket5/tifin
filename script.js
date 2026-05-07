// Web App URL
const webAppUrl = "https://script.google.com/macros/s/AKfycbzqN1gjglWMpkU969zVZr3QvEGbVU82w7a_fvMnKVkaS8-o4h45powEMWih5EQFM_MV4g/exec";

let membersData = [];
let isAdmin = false;
let currentEditIndex = null;

// Navigation
document.querySelectorAll('.nav-link-custom').forEach(link => {
    link.addEventListener('click', function() {
        const pageId = this.getAttribute('data-page');
        document.querySelectorAll('.nav-link-custom').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
        document.getElementById(`${pageId}-page`).classList.add('active-page');
    });
});

function openLoginModal() {
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').classList.add('d-none');
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function verifyLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // CHANGE YOUR USERNAME AND PASSWORD HERE
    if (username === 'admin' && password === 'admin123') {
        isAdmin = true;
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        
        const loginBtn = document.querySelector('.login-btn');
        loginBtn.innerHTML = '<i class="fas fa-user-check me-2"></i>Admin Mode';
        loginBtn.classList.add('admin-mode');
        
        document.getElementById('edit-col-header').style.display = 'table-cell';
        renderMembersTable();
        
        alert('✅ Admin login successful! You can now edit data.');
    } else {
        document.getElementById('loginError').textContent = '❌ Invalid username or password!';
        document.getElementById('loginError').classList.remove('d-none');
    }
}

function editMember(index) {
    if (!isAdmin) {
        alert('Please login as admin first!');
        return;
    }
    
    const member = membersData[index];
    currentEditIndex = index;
    
    document.getElementById('editName').value = member.name;
    document.getElementById('editTaka').value = member.taka;
    document.getElementById('editMeal').value = member.meal;
    document.getElementById('editHandcash').value = member.handcash;
    
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

async function saveMemberData() {
    const updatedMember = {
        name: document.getElementById('editName').value,
        taka: parseFloat(document.getElementById('editTaka').value) || 0,
        meal: parseInt(document.getElementById('editMeal').value) || 0,
        handcash: parseFloat(document.getElementById('editHandcash').value) || 0
    };
    
    membersData[currentEditIndex] = updatedMember;
    await updateGoogleSheet();
    renderMembersTable();
    updateDashboardStats();
    
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    alert('✅ Data updated successfully!');
}

async function updateGoogleSheet() {
    try {
        await fetch(webAppUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: membersData, action: 'update' })
        });
        console.log('Update sent to Google Sheet');
    } catch (error) {
        console.error('Update error:', error);
    }
}

function renderMembersTable() {
    const listBody = document.getElementById('member-list');
    listBody.innerHTML = '';
    
    membersData.forEach((member, index) => {
        const mealText = member.meal === 1 ? 'Meal' : 'Meals';
        const editButton = isAdmin ? 
            `<td><button class="edit-btn" onclick="editMember(${index})"><i class="fas fa-edit"></i> Edit</button></td>` : '';
        
        const row = `
            <tr>
                <td><i class="fas fa-user-circle text-primary me-2"></i>${member.name}</td>
                <td><span class="badge-custom" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 5px 12px; border-radius: 8px;">৳ ${(member.taka || 0).toFixed(2)}</span></td>
                <td><span class="badge-custom" style="background: #ffecd2; color: #f39c12; padding: 5px 12px; border-radius: 8px;"><i class="fas fa-utensils me-1"></i>${member.meal || 0} ${mealText}</span></td>
                <td><span class="badge-custom" style="background: #d4edda; color: #28a745; padding: 5px 12px; border-radius: 8px;"><i class="fas fa-hand-holding-usd me-1"></i>৳ ${(member.handcash || 0).toFixed(2)}</span></td>
                ${editButton}
            </tr>
        `;
        listBody.innerHTML += row;
    });
}

function updateDashboardStats() {
    const totalMeals = membersData.reduce((sum, m) => sum + (Number(m.meal) || 0), 0);
    const totalMembers = membersData.length;
    const totalAmount = membersData.reduce((sum, m) => sum + (Number(m.taka) || 0), 0);
    const avgAmount = totalMembers > 0 ? totalAmount / totalMembers : 0;
    
    let totalExpense = 0;
    if (window.summaryData && window.summaryData.totalExpense) {
        totalExpense = Number(window.summaryData.totalExpense);
    }
    
    // Update Summary Table (Separate)
    document.getElementById('total-amt-display').innerHTML = `৳ ${totalAmount.toFixed(2)}`;
    document.getElementById('total-exp-display').innerHTML = `৳ ${totalExpense.toFixed(2)}`;
    document.getElementById('month-display').innerHTML = window.summaryData?.month || 'January';
    
    // Update Extra Stats
    document.getElementById('total-meals').innerText = totalMeals;
    document.getElementById('total-members').innerText = totalMembers;
    document.getElementById('avg-amount').innerHTML = `৳ ${avgAmount.toFixed(2)}`;
    
    // Update Footer
    document.getElementById('footer-total').innerHTML = `৳ ${totalAmount.toFixed(2)}`;
    document.getElementById('footer-expense').innerHTML = `৳ ${totalExpense.toFixed(2)}`;
    document.getElementById('footer-month').innerText = window.summaryData?.month || 'January';
}

async function fetchData() {
    try {
        document.getElementById('loader').style.display = 'block';
        
        const response = await fetch(webAppUrl);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        membersData = data.members || [];
        window.summaryData = data.summary || {};
        
        updateDashboardStats();
        renderMembersTable();
        
        document.getElementById('loader').style.display = 'none';
        
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('loader').innerHTML = `<div class="alert alert-danger m-4">Error: ${error.message}</div>`;
    }
}

window.onload = () => {
    fetchData();
    setInterval(fetchData, 30000);
};
