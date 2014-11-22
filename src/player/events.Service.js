
/**
 * PlayerEvents :: This is a service to manage all standard Player events and to register any custom
 * event listeners. It's basically a wrapper for broadcasts and listens which are fired on the root
 * scope. However, using this wrapper, other classes don't have to depend on the root scope all the time.
 * The class also defines which document events should be listend to on the player HTML element.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Events.Service', [])

/**
 * Factory definition
 */
.factory('PlayerEvents', function($document, $rootScope) {

	/**
	 * Class definition
	 */
	var PlayerEvents = {

		/**
		 * Returns the necessary events that the element needs to listen to
		 */
		getElementEvents: function() {
			return ['click', 'mousemove', 'mouseout', 'mousewheel'];
		},

		/**
		 * Document wide keydown registrar
		 */
		keydown: function(listener) {
			$document.on('keydown.ngGo.player', listener);
		},

		/**
		 * Event listener
		 */
		listen: function(type, listener) {

			//Keydown listener is global
			if (type == 'keydown') {
				this.keydown(listener);
				return;
			}

			//Listen for event
			$rootScope.$on('ngGo.player.' + type, listener);
		},

		/**
		 * Event broadcaster
		 */
		broadcast: function(type, event) {
			$rootScope.$broadcast('ngGo.player.' + type, event);
		},

		/**
		 * Kifu loaded
		 */
		kifuLoaded: function(kifu) {
			$rootScope.$broadcast('ngGo.player.kifuLoaded', kifu);
		},

		/**
		 * Player update
		 */
		update: function(action) {
			$rootScope.$broadcast('ngGo.player.update', action);
		},

		/**
		 * Player notification
		 */
		notification: function(notification, data) {
			$rootScope.$broadcast('ngGo.player.notification', notification, data);
		}
	};

	//Return
	return PlayerEvents;
});