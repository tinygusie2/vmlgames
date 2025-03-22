// Load games for carousel
function loadCarousel() {
  fetch('/api/games')
    .then(response => response.json())
    .then(games => {
      const track = document.getElementById('carousel-track');
      if (!track) return;

      games.forEach(game => {
        const gameCard = document.createElement('a');
        gameCard.href = `/game/${encodeURIComponent(game.title)}`;
        gameCard.classList.add('game-card');
        gameCard.innerHTML = `
          ${game.image ? `<img src="${game.image}" alt="${game.title}">` : `<div class="title-banner">${game.title}</div>`}
          <div>
            <h3>${game.title}</h3>
            <p>${game.description}</p>
          </div>
        `;
        track.appendChild(gameCard);
      });

      // Initialize carousel controls
      const prevButton = document.querySelector('.carousel-button.prev');
      const nextButton = document.querySelector('.carousel-button.next');
      let position = 0;
      const cardWidth = 300 + 32; // card width + gap

      function updateCarousel() {
        track.style.transform = `translateX(${position}px)`;
      }

      if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
          position = Math.min(position + cardWidth, 0);
          updateCarousel();
        });

        nextButton.addEventListener('click', () => {
          const maxScroll = -(cardWidth * (games.length - 3));
          position = Math.max(position - cardWidth, maxScroll);
          updateCarousel();
        });
      }
    });
}

// Load carousel on homepage
if (document.getElementById('carousel-track')) {
  loadCarousel();
}

// Load games on the library page with search functionality
if (document.getElementById('games-container')) {
    fetch('/api/games')
      .then(response => response.json())
      .then(games => {
        const container = document.getElementById('games-container');
        const searchInput = document.getElementById('game-search');

        function displayGames(filteredGames) {
          container.innerHTML = ''; // Clear existing games
          filteredGames.forEach(game => {
            const gameCard = document.createElement('a');
            gameCard.href = `/game/${encodeURIComponent(game.title)}`;
            gameCard.classList.add('game-card');
            gameCard.innerHTML = `
              ${game.image ? `<img src="${game.image}" alt="${game.title}">` : `<div class="title-banner">${game.title}</div>`}
              <div>
                <h3>${game.title}</h3>
                <p>${game.description}</p>
              </div>
            `;
            container.appendChild(gameCard);
          });
        }

        function filterGames(searchTerm) {
          const lowerCaseSearchTerm = searchTerm.toLowerCase();
          const filteredGames = games.filter(game => {
            return game.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                   game.description.toLowerCase().includes(lowerCaseSearchTerm);
          });
          displayGames(filteredGames);
        }

        searchInput.addEventListener('input', () => {
          filterGames(searchInput.value);
        });

        // Initial display of all games
        displayGames(games);
      });
}


// Load game in iframe on game page
if (document.getElementById('game-iframe')) {
    const title = decodeURIComponent(window.location.pathname.split('/game/')[1]);
    fetch('/api/games')
      .then(response => response.json())
      .then(games => {
        const game = games.find(g => g.title === title);
        const iframe = document.getElementById('game-iframe');
        const errorMessage = document.getElementById('iframe-error');
        const popup = document.getElementById('info-popup');
        const popupTitle = document.getElementById('popup-title');
        const popupText = document.getElementById('popup-text');
        const dontShowCheckbox = document.getElementById('dont-show-again');
        const closePopupBtn = document.getElementById('close-popup');

        if (game) {
          document.getElementById('game-title').textContent = game.title;
          document.getElementById('game-text').textContent = game.gameText || '';
          iframe.src = game.gameUrl;
          iframe.onload = () => {
            errorMessage.style.display = 'none';
            // Check if user has chosen to not show popup for this game
            const dontShowPopup = localStorage.getItem(`dontShowPopup_${game.title}`);
            if (!dontShowPopup && game.gameText) {
              popupTitle.textContent = game.title;
              popupText.textContent = game.gameText;
              popup.style.display = 'flex';
            }
          };
          iframe.onerror = () => {
            errorMessage.style.display = 'block';
            iframe.style.display = 'none';
          };

          // Handle popup close button
          closePopupBtn.onclick = () => {
            if (dontShowCheckbox.checked) {
              localStorage.setItem(`dontShowPopup_${game.title}`, 'true');
            }
            popup.style.display = 'none';
          };
        } else {
          document.getElementById('game-title').textContent = 'Game Not Found';
          errorMessage.style.display = 'block';
          iframe.style.display = 'none';
        }
      });
  
    // Full-screen toggle
    const iframe = document.getElementById('game-iframe');
    const iframeContainer = document.querySelector('.iframe-container');
    document.getElementById('fullscreen-btn').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        iframeContainer.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
          alert('Fullscreen mode niet beschikbaar');
        });
      } else {
        document.exitFullscreen().catch(err => {
          console.error('Error attempting to exit fullscreen:', err);
        });
      }
    });
  }
  
  // Handle admin login
  if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
  
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      .then(response => {
        if (!response.ok) throw new Error('Login failed');
        return response.json();
      })
      .then(data => {
        // Create and show success popup
        const successPopup = document.createElement('div');
        successPopup.style.position = 'fixed';
        successPopup.style.top = '50%';
        successPopup.style.left = '50%';
        successPopup.style.transform = 'translate(-50%, -50%)';
        successPopup.style.background = '#00008B';
        successPopup.style.color = '#FFFFFF';
        successPopup.style.padding = '20px';
        successPopup.style.borderRadius = '10px';
        successPopup.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
        successPopup.style.zIndex = '1000';
        successPopup.style.textAlign = 'center';
        successPopup.innerHTML = `
          <h3 style="margin: 0 0 10px 0;">Login Succesvol!</h3>
          <p style="margin: 0;">U wordt doorgestuurd naar het dashboard...</p>
        `;
        document.body.appendChild(successPopup);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          document.body.removeChild(successPopup);
          window.location.href = data.redirect;
        }, 2000);
      })
      .catch(error => {
        // Create and show error popup
        const errorPopup = document.createElement('div');
        errorPopup.style.position = 'fixed';
        errorPopup.style.top = '50%';
        errorPopup.style.left = '50%';
        errorPopup.style.transform = 'translate(-50%, -50%)';
        errorPopup.style.background = '#FF0000';
        errorPopup.style.color = '#FFFFFF';
        errorPopup.style.padding = '20px';
        errorPopup.style.borderRadius = '10px';
        errorPopup.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
        errorPopup.style.zIndex = '1000';
        errorPopup.style.textAlign = 'center';
        errorPopup.innerHTML = `
          <h3 style="margin: 0 0 10px 0;">Login Mislukt!</h3>
          <p style="margin: 0;">Ongeldig wachtwoord</p>
        `;
        document.body.appendChild(errorPopup);
        
        // Remove popup after 2 seconds
        setTimeout(() => {
          document.body.removeChild(errorPopup);
        }, 2000);
        
        console.error(error);
      });
    });
  }
  
  // Handle admin dashboard
  if (document.getElementById('add-game-form')) {
    // Add game
    document.getElementById('add-game-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const game = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        image: document.getElementById('image').value || '',
        gameUrl: document.getElementById('gameUrl').value,
        gameText: document.getElementById('gameText').value || ''
      };
  
      fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game)
      })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        document.getElementById('add-game-form').reset();
        loadGamesForManagement();
      });
    });
  
    // Load games for management
    function loadGamesForManagement() {
      fetch('/api/games')
        .then(response => response.json())
        .then(games => {
          const container = document.getElementById('games-list');
          container.innerHTML = '';
          games.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.classList.add('game-item');
            gameItem.innerHTML = `
              ${game.image ? `<img src="${game.image}" alt="${game.title}" style="max-width: 100px; margin-bottom: 0.5rem;">` : `<div class="title-banner" style="font-size: 1rem; height: 50px; margin-bottom: 0.5rem;">${game.title}</div>`}
              <h3>${game.title}</h3>
              <p>${game.description}</p>
              <p>Image: ${game.image || 'None'}</p>
              <p>URL: ${game.gameUrl}</p>
              <p>Popup Info: ${game.gameText || 'None'}</p>
              <button onclick="showEditForm('${game.title}')">Edit</button>
              <button onclick="deleteGame('${game.title}')">Delete</button>
            `;
            container.appendChild(gameItem);
          });
        });
    }
  
    // Show edit form
    window.showEditForm = function(title) {
      fetch('/api/games')
        .then(response => response.json())
        .then(games => {
          const game = games.find(g => g.title === title);
          if (game) {
            document.getElementById('edit-title').value = game.title;
            document.getElementById('edit-description').value = game.description;
            document.getElementById('edit-image').value = game.image || '';
            document.getElementById('edit-gameUrl').value = game.gameUrl;
            document.getElementById('edit-gameText').value = game.gameText || '';
            document.getElementById('edit-form-container').style.display = 'block';
            document.getElementById('edit-game-form').dataset.originalTitle = title; // Store original title
          }
        });
    };
  
    // Handle edit form submission
    document.getElementById('edit-game-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const originalTitle = document.getElementById('edit-game-form').dataset.originalTitle;
      const updatedGame = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        image: document.getElementById('edit-image').value || '',
        gameUrl: document.getElementById('edit-gameUrl').value,
        gameText: document.getElementById('edit-gameText').value || ''
      };
  
      fetch(`/api/games/${encodeURIComponent(originalTitle)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGame)
      })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        document.getElementById('edit-form-container').style.display = 'none';
        loadGamesForManagement();
      });
    });
  
    // Cancel edit
    document.getElementById('cancel-edit').addEventListener('click', () => {
      document.getElementById('edit-form-container').style.display = 'none';
    });
  
    // Delete game
    window.deleteGame = function(title) {
      if (confirm(`Are you sure you want to delete ${title}?`)) {
        fetch(`/api/games/${encodeURIComponent(title)}`, {
          method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
          // Create and show success message UI
          const messageUI = document.createElement('div');
          messageUI.style.position = 'fixed';
          messageUI.style.top = '20px';
          messageUI.style.right = '20px';
          messageUI.style.background = '#4CAF50';
          messageUI.style.color = 'white';
          messageUI.style.padding = '15px 25px';
          messageUI.style.borderRadius = '5px';
          messageUI.style.zIndex = '1000';
          messageUI.textContent = data.message;
          document.body.appendChild(messageUI);

          // Remove message after 3 seconds
          setTimeout(() => {
            document.body.removeChild(messageUI);
          }, 100);
          loadGamesForManagement();
        });
      }
    };

    
  
    // Initial load
    loadGamesForManagement();
  }
