import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { StorageBaseRepository } from './storage-base.repository';

@Injectable({
  providedIn: 'root'
})
class TestStorageRepository extends StorageBaseRepository {
  public testGetItems<T>(key: string): T[] {
    return this.getItems<T>(key);
  }

  public testSetItems<T>(key: string, items: T[]): void {
    this.setItems<T>(key, items);
  }

  public testGetObject<T>(key: string, fallback: T): T {
    return this.getObject<T>(key, fallback);
  }

  public testSetObject<T>(key: string, value: T): void {
    this.setObject<T>(key, value);
  }

  public testGenerateId(prefix: string): string {
    return this.generateId(prefix);
  }
}

describe('StorageBaseRepository', () => {
  let repository: TestStorageRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestStorageRepository]
    });
    repository = TestBed.inject(TestStorageRepository);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  it('should return empty array if key does not exist in localStorage', () => {
    const items = repository.testGetItems<{ id: string }>('non_existing_key');
    expect(items).toEqual([]);
  });

  it('should save and retrieve items array correctly', () => {
    const data = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];
    repository.testSetItems('test_key', data);

    const retrieved = repository.testGetItems<{ id: string; name: string }>('test_key');
    expect(retrieved).toEqual(data);
  });

  it('should save and retrieve object correctly', () => {
    const config = { theme: 'dark', itemsPerPage: 10 };
    repository.testSetObject('config_key', config);

    const retrieved = repository.testGetObject('config_key', { theme: 'light', itemsPerPage: 5 });
    expect(retrieved).toEqual(config);
  });

  it('should return fallback object if key does not exist', () => {
    const fallback = { count: 42 };
    const result = repository.testGetObject('missing_obj', fallback);
    expect(result).toEqual(fallback);
  });

  it('should generate unique prefixed IDs', () => {
    const id1 = repository.testGenerateId('sal');
    const id2 = repository.testGenerateId('sal');

    expect(id1.startsWith('sal_')).toBe(true);
    expect(id2.startsWith('sal_')).toBe(true);
    expect(id1).not.toEqual(id2);
  });
});
