type ServiceFactory<T> = (container: ServiceContainer) => T;

/**
 * A lightweight service container with per-container singletons,
 * lazy instantiation, dependency-aware factories, and test overrides.
 */
export class ServiceContainer {
  private factories: Map<string, ServiceFactory<any>> = new Map();
  private instances: Map<string, any> = new Map();
  private constructing: Set<string> = new Set();

  /**
   * Register a factory for a service key. The factory receives this container
   * to resolve its own dependencies via container.get(...).
   */
  register<T>(key: string, factory: ServiceFactory<T>): void {
    this.factories.set(key, factory as ServiceFactory<any>);
  }

  /**
   * Override a service instance (useful in tests). This bypasses factory creation
   * and forces the container to return the provided instance for the given key.
   */
  override<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  /**
   * Resolve (and lazily instantiate) a service by key. Ensures singleton-per-container
   * semantics and performs basic cycle detection to avoid infinite loops in dependencies.
   */
  get<T>(key: string): T {
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`Service factory not registered for key: ${key}`);
    }

    if (this.constructing.has(key)) {
      throw new Error(`Circular dependency detected while constructing service: ${key}`);
    }

    this.constructing.add(key);
    try {
      const instance = factory(this);
      this.instances.set(key, instance);
      return instance as T;
    } finally {
      this.constructing.delete(key);
    }
  }

  /**
   * Whether a factory has been registered for a key.
   */
  has(key: string): boolean {
    return this.factories.has(key);
  }

  /**
   * Clear only instantiated instances (keep factories). Useful for resetting
   * state within the same container between tests if desired.
   */
  resetInstances(): void {
    this.instances.clear();
  }
}
