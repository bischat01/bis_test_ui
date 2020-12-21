import Version from "./Version";
import Logger from "./Logger";

/**
 * Represents a cache managing class for the cache storage
 */
export default class CacheManager {
	/**
	 * Opens a cache with the specified name (version).
	 * It there is no cache with such a name a new cache will be created
	 *
	 * @param {string} version
	 * @returns {Promise<*>}
	 */
	static async create({version}) {
		return await new CacheManager().open({version});
	}

	/**
	 * Deletes every version with a different version number than the current version
	 * @param currentVersion
	 * @returns {Promise<boolean[]>}
	 */
	static async cleanup(currentVersion) {
		Logger.getLogger().log(
			"Clear outdated for current version: " + currentVersion.asString()
		);
		const cacheNames = await self.caches.keys();
		const aPromises = cacheNames
			.filter(function(cacheName) {
				Logger.getLogger().log("Cache: " + cacheName);
				try {
					const cacheVersion = Version.fromStringWithDelimiter(
						cacheName,
						currentVersion.delimiter
					);
					return cacheVersion.compare(currentVersion) !== 0;
				} catch (e) {
					return false;
				}
			})
			.map(function(cacheName) {
				Logger.getLogger().log("Delete: " + cacheName);
				return self.caches.delete(cacheName);
			});
		return await Promise.all(aPromises);
	}

	/**
	 * Opens an existing cache or creates a new one
	 * @param version
	 * @returns {Promise<CacheManager>}
	 */
	async open({version}) {
		this.cache = await self.caches.open(version);
		return this;
	}

	/**
	 * Retrieves a response if cache matches request
	 * @param request
	 * @returns {Promise<Response>}
	 */
	async get(request) {
		return await this.cache.match(request);
	}

	/**
	 * Deletes all caches
	 * @param cacheKeys
	 * @returns {Promise<CacheManager>}
	 */
	async truncate(cacheKeys) {
		const keys = cacheKeys || (await self.caches.keys());
		await Promise.all(keys.map(self.caches.delete.bind(self.caches)));
		return this;
	}

	/**
	 * Puts a new request with respective response to the cache
	 * @param request
	 * @param response
	 * @returns {Promise<CacheManager>}
	 */
	async put(request, response) {
		// HEAD and POST requests are not supported by the cache manager
		if (request.method === "HEAD" || request.method === "POST") {
			return this;
		}
		await this.cache.put(request, response.clone());
		return this;
	}

	/**
	 * Deletes a request from the cache
	 * @param request
	 * @returns {Promise<CacheManager>}
	 */
	async delete(request) {
		await this.cache.delete(request);
		return this;
	}
}
