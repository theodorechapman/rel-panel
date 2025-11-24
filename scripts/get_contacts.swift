import Contacts
import Foundation

// Helper to normalize phone numbers (keep only digits)
func normalizePhoneNumber(_ number: String) -> String {
    let allowedCharacters = CharacterSet.decimalDigits
    return number.unicodeScalars
        .filter { allowedCharacters.contains($0) }
        .map { String($0) }
        .joined()
}

// Function to load contacts and create a map of phone numbers to names
func loadPhoneToNameMap() throws -> [String: String] {
    let store = CNContactStore()
    
    var accessError: Error?
    let semaphore = DispatchSemaphore(value: 0)
    
    store.requestAccess(for: .contacts) { granted, error in
        if let error = error {
            accessError = error
        } else if !granted {
            accessError = NSError(domain: "ContactsHelper",
                                  code: 1,
                                  userInfo: [NSLocalizedDescriptionKey: "Access to contacts denied"])
        }
        semaphore.signal()
    }
    semaphore.wait()
    
    if let error = accessError {
        throw error
    }
    
    let keysToFetch: [CNKeyDescriptor] = [
        CNContactGivenNameKey as CNKeyDescriptor,
        CNContactFamilyNameKey as CNKeyDescriptor,
        CNContactPhoneNumbersKey as CNKeyDescriptor,
        CNContactOrganizationNameKey as CNKeyDescriptor
    ]
    
    let request = CNContactFetchRequest(keysToFetch: keysToFetch)
    var map: [String: String] = [:]
    
    try store.enumerateContacts(with: request) { contact, _ in
        var fullName = "\(contact.givenName) \(contact.familyName)".trimmingCharacters(in: .whitespaces)
        if fullName.isEmpty && !contact.organizationName.isEmpty {
            fullName = contact.organizationName
        }
        
        for phone in contact.phoneNumbers {
            let rawNumber = phone.value.stringValue
            let normalized = normalizePhoneNumber(rawNumber)
            
            if !normalized.isEmpty {
                map[normalized] = fullName
            }
        }
    }
    
    return map
}

// Main execution
do {
    // Fetch all contacts
    let phoneMap = try loadPhoneToNameMap()
    
    // Convert to JSON
    let jsonData = try JSONSerialization.data(withJSONObject: phoneMap, options: [])
    
    // Print JSON to stdout
    if let jsonString = String(data: jsonData, encoding: .utf8) {
        print(jsonString)
    }
} catch {
    // Print error to stderr
    fputs("Error: \(error.localizedDescription)\n", stderr)
    exit(1)
}

