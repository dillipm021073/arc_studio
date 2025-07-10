#!/usr/bin/env python3
import psycopg2
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment
db_url = os.environ.get('DATABASE_URL')

def analyze_and_fix_level_a_processes():
    """Find and fix Level A processes that have parent relationships"""
    
    # Parse database URL
    parsed = urlparse(db_url)
    
    try:
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],
            user=parsed.username,
            password=parsed.password
        )
        cursor = conn.cursor()
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return
    
    print("Analyzing Business Processes...")
    print("=" * 80)
    
    # Find all Level A processes
    cursor.execute("""
        SELECT id, business_process, level, status
        FROM business_processes
        WHERE level = 'A'
        ORDER BY business_process
    """)
    level_a_processes = cursor.fetchall()
    
    print(f"\nFound {len(level_a_processes)} Level A processes:")
    for proc in level_a_processes:
        print(f"  ID: {proc[0]}, Name: {proc[1]}, Level: {proc[2]}, Status: {proc[3]}")
    
    # Check which Level A processes have parent relationships
    print("\n" + "=" * 80)
    print("Checking for Level A processes with parent relationships...")
    
    cursor.execute("""
        SELECT bp.id, bp.business_process, bp.level, bpr.parent_process_id, 
               parent.business_process as parentName, parent.level as parentLevel
        FROM business_processes bp
        JOIN business_process_relationships bpr ON bp.id = bpr.child_process_id
        JOIN business_processes parent ON bpr.parent_process_id = parent.id
        WHERE bp.level = 'A'
    """)
    
    problematic_processes = cursor.fetchall()
    
    if problematic_processes:
        print(f"\nFOUND {len(problematic_processes)} Level A processes with parent relationships (INVALID):")
        for proc in problematic_processes:
            print(f"\n  Child: {proc[1]} (ID: {proc[0]}, Level: {proc[2]})")
            print(f"  Parent: {proc[4]} (ID: {proc[3]}, Level: {proc[5]})")
        
        # Fix the issue by removing parent relationships for Level A processes
        print("\n" + "=" * 80)
        print("Fixing the issue by removing parent relationships for Level A processes...")
        
        for proc in problematic_processes:
            cursor.execute("""
                DELETE FROM business_process_relationships
                WHERE child_process_id = %s AND parent_process_id = %s
            """, (proc[0], proc[3]))
            print(f"  Removed parent relationship: {proc[1]} is no longer a child of {proc[4]}")
        
        conn.commit()
        print("\nAll invalid parent relationships have been removed!")
    else:
        print("\nNo Level A processes with parent relationships found (Good!)")
    
    # Check for orphaned processes (non-Level A processes without parents)
    print("\n" + "=" * 80)
    print("Checking for orphaned processes (non-Level A without parents)...")
    
    cursor.execute("""
        SELECT bp.id, bp.business_process, bp.level, bp.status
        FROM business_processes bp
        WHERE bp.level != 'A'
        AND bp.id NOT IN (
            SELECT child_process_id FROM business_process_relationships
        )
        ORDER BY bp.level, bp.business_process
    """)
    
    orphaned_processes = cursor.fetchall()
    
    if orphaned_processes:
        print(f"\nFound {len(orphaned_processes)} orphaned processes:")
        for proc in orphaned_processes:
            print(f"  ID: {proc[0]}, Name: {proc[1]}, Level: {proc[2]}, Status: {proc[3]}")
        print("\nThese processes should either be Level A or have a parent process!")
    else:
        print("\nNo orphaned processes found (Good!)")
    
    # Show final tree structure
    print("\n" + "=" * 80)
    print("Final Business Process Tree Structure:")
    
    # Get all relationships
    cursor.execute("""
        SELECT parent.business_process as parentName, parent.level as parentLevel,
               child.business_process as childName, child.level as childLevel,
               bpr.sequence_number
        FROM business_process_relationships bpr
        JOIN business_processes parent ON bpr.parent_process_id = parent.id
        JOIN business_processes child ON bpr.child_process_id = child.id
        ORDER BY parent.business_process, bpr.sequence_number
    """)
    
    relationships = cursor.fetchall()
    
    # Group by parent
    parent_children = {}
    for rel in relationships:
        parent = f"{rel[0]} (Level {rel[1]})"
        child = f"{rel[2]} (Level {rel[3]}, Seq: {rel[4]})"
        if parent not in parent_children:
            parent_children[parent] = []
        parent_children[parent].append(child)
    
    # Display tree
    for parent, children in parent_children.items():
        print(f"\n{parent}")
        for child in children:
            print(f"  └── {child}")
    
    conn.close()
    print("\n" + "=" * 80)
    print("Analysis complete!")

if __name__ == "__main__":
    analyze_and_fix_level_a_processes()