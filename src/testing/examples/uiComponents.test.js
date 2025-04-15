const { TestRunner } = require('../testRunner');
const { waitForElement, waitFor } = require('../utils/testHelpers');

describe('UI Component Tests', () => {
    let runner;
    
    beforeEach(async () => {
        runner = new TestRunner({
            reporters: ['console', 'html'],
            browserDebug: true,
            screenshotOnFailure: true
        });

        // Set up test component
        document.body.innerHTML = `
            <div id="test-container">
                <button id="toggle-btn">Toggle</button>
                <div id="content" style="display: none;">
                    Hidden Content
                </div>
                <form id="test-form">
                    <input type="text" id="name" placeholder="Enter name">
                    <input type="email" id="email" placeholder="Enter email">
                    <button type="submit">Submit</button>
                </form>
                <ul id="list"></ul>
            </div>
        `;

        // Add event listeners
        document.getElementById('toggle-btn').addEventListener('click', () => {
            const content = document.getElementById('content');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('test-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const list = document.getElementById('list');
            const item = document.createElement('li');
            item.textContent = `${name} (${email})`;
            list.appendChild(item);
        });
    });

    afterEach(async () => {
        await runner.cleanup();
    });

    test('should toggle content visibility', async () => {
        const button = document.getElementById('toggle-btn');
        const content = document.getElementById('content');

        // Initial state
        expect(content.style.display).toBe('none');

        // Click button
        button.click();
        await waitFor(() => content.style.display === 'block');
        expect(content.style.display).toBe('block');

        // Click again
        button.click();
        await waitFor(() => content.style.display === 'none');
        expect(content.style.display).toBe('none');
    });

    test('should handle form submission', async () => {
        const form = document.getElementById('test-form');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const list = document.getElementById('list');

        // Fill form
        nameInput.value = 'John Doe';
        emailInput.value = 'john@example.com';

        // Submit form
        form.dispatchEvent(new Event('submit'));

        // Wait for list item to appear
        await waitForElement('#list li');
        
        const items = list.getElementsByTagName('li');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toBe('John Doe (john@example.com)');
    });

    test('should validate form inputs', async () => {
        const form = document.getElementById('test-form');
        const emailInput = document.getElementById('email');

        // Test invalid email
        emailInput.value = 'invalid-email';
        
        // Get validation message
        emailInput.checkValidity();
        expect(emailInput.validity.valid).toBe(false);
        
        // Test valid email
        emailInput.value = 'valid@example.com';
        expect(emailInput.validity.valid).toBe(true);
    });

    test('should handle multiple form submissions', async () => {
        const form = document.getElementById('test-form');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const list = document.getElementById('list');

        const users = [
            { name: 'John Doe', email: 'john@example.com' },
            { name: 'Jane Smith', email: 'jane@example.com' },
            { name: 'Bob Wilson', email: 'bob@example.com' }
        ];

        // Submit multiple entries
        for (const user of users) {
            nameInput.value = user.name;
            emailInput.value = user.email;
            form.dispatchEvent(new Event('submit'));
        }

        // Wait for all items to appear
        await waitFor(() => list.children.length === users.length);
        
        const items = Array.from(list.getElementsByTagName('li'));
        expect(items.length).toBe(users.length);
        
        items.forEach((item, index) => {
            const user = users[index];
            expect(item.textContent).toBe(`${user.name} (${user.email})`);
        });
    });

    test('should handle rapid UI interactions', async () => {
        const button = document.getElementById('toggle-btn');
        const content = document.getElementById('content');

        // Rapid toggling
        const toggleCount = 5;
        const togglePromises = [];

        for (let i = 0; i < toggleCount; i++) {
            togglePromises.push(
                (async () => {
                    button.click();
                    await waitFor(() => 
                        content.style.display === (i % 2 === 0 ? 'block' : 'none')
                    );
                })()
            );
        }

        await Promise.all(togglePromises);
        
        // Final state should match last toggle
        expect(content.style.display).toBe(toggleCount % 2 === 0 ? 'none' : 'block');
    });

    test('should maintain UI state during async operations', async () => {
        const button = document.getElementById('toggle-btn');
        const content = document.getElementById('content');
        const form = document.getElementById('test-form');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        // Perform multiple async operations
        await Promise.all([
            // Toggle content
            (async () => {
                button.click();
                await waitFor(() => content.style.display === 'block');
            })(),
            
            // Submit form
            (async () => {
                nameInput.value = 'Test User';
                emailInput.value = 'test@example.com';
                form.dispatchEvent(new Event('submit'));
                await waitForElement('#list li');
            })()
        ]);

        // Verify final state
        expect(content.style.display).toBe('block');
        expect(document.querySelector('#list li').textContent)
            .toBe('Test User (test@example.com)');
    });
}); 