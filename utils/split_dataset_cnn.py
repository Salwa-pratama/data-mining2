import os
import shutil
import random
import sys

def split_dataset():
    # Set seed for reproducibility
    random.seed(42)
    
    # Define paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    cnn_dir = os.path.join(project_root, 'dataset', 'project2', 'cnn')
    
    train_dir = os.path.join(cnn_dir, 'train')
    valid_dir = os.path.join(cnn_dir, 'valid')
    test_dir = os.path.join(cnn_dir, 'test')
    
    print("=" * 60)
    print("DATASET SPLITTER FOR CNN PROJECT 2")
    print("=" * 60)
    print(f"Project Root: {project_root}")
    print(f"CNN Dataset Directory: {cnn_dir}")
    
    # Check if train directory exists
    if not os.path.exists(train_dir):
        print(f"Error: Train directory not found at '{train_dir}'.")
        print("Please make sure you have the dataset in the correct folder structure.")
        sys.exit(1)
        
    # Check if class folders exist inside train
    classes = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]
    if not classes:
        print(f"Error: No class subdirectories (like Dog, Cat) found in '{train_dir}'.")
        sys.exit(1)
        
    print(f"Found classes: {classes}")
    
    # Safety Check: check if valid or test directories already exist and contain files
    already_split = False
    for target in [valid_dir, test_dir]:
        if os.path.exists(target):
            for c in classes:
                c_path = os.path.join(target, c)
                if os.path.exists(c_path) and len(os.listdir(c_path)) > 0:
                    already_split = True
                    break
                    
    if already_split:
        print("\n[WARNING] It looks like the dataset might have already been split.")
        print("The 'valid' or 'test' directory already contains files.")
        confirm = input("Do you want to proceed anyway? This might cause incorrect splits (y/N): ")
        if confirm.lower() != 'y':
            print("Aborted.")
            sys.exit(0)

    # Perform split for each class
    for class_name in classes:
        src_class_dir = os.path.join(train_dir, class_name)
        
        # Get all files (excluding subdirectories if any)
        all_files = [f for f in os.listdir(src_class_dir) if os.path.isfile(os.path.join(src_class_dir, f))]
        total_files = len(all_files)
        
        print(f"\nProcessing class: {class_name}")
        print(f"  Total images found in train: {total_files}")
        
        if total_files == 0:
            print(f"  Skipping {class_name} because it is empty.")
            continue
            
        # Shuffle the files list
        random.shuffle(all_files)
        
        # Calculate split sizes
        # 70% Train, 15% Valid, 15% Test
        train_count = int(0.70 * total_files)
        test_count = int(0.15 * total_files)
        valid_count = total_files - train_count - test_count  # Keep the remainder in valid to sum to total_files
        
        print(f"  Target Split:")
        print(f"    - Train (70%): {train_count} images")
        print(f"    - Valid (15%): {valid_count} images")
        print(f"    - Test (15%): {test_count} images")
        
        # Slices
        train_files = all_files[:train_count]
        test_files = all_files[train_count:train_count + test_count]
        valid_files = all_files[train_count + test_count:]
        
        # Create destination directories
        dest_valid_class_dir = os.path.join(valid_dir, class_name)
        dest_test_class_dir = os.path.join(test_dir, class_name)
        
        os.makedirs(dest_valid_class_dir, exist_ok=True)
        os.makedirs(dest_test_class_dir, exist_ok=True)
        
        # Move files to test
        print(f"  Moving {len(test_files)} images to test...")
        for i, file_name in enumerate(test_files):
            src_path = os.path.join(src_class_dir, file_name)
            dest_path = os.path.join(dest_test_class_dir, file_name)
            shutil.move(src_path, dest_path)
            if (i + 1) % 500 == 0 or (i + 1) == len(test_files):
                print(f"    Moved {i + 1}/{len(test_files)} files")
                
        # Move files to valid
        print(f"  Moving {len(valid_files)} images to valid...")
        for i, file_name in enumerate(valid_files):
            src_path = os.path.join(src_class_dir, file_name)
            dest_path = os.path.join(dest_valid_class_dir, file_name)
            shutil.move(src_path, dest_path)
            if (i + 1) % 500 == 0 or (i + 1) == len(valid_files):
                print(f"    Moved {i + 1}/{len(valid_files)} files")
                
        # Verify final count in train folder
        remaining_train_files = len(os.listdir(src_class_dir))
        print(f"  Finished splitting {class_name}:")
        print(f"    - Remaining in Train: {remaining_train_files}")
        print(f"    - Moved to Valid: {len(os.listdir(dest_valid_class_dir))}")
        print(f"    - Moved to Test: {len(os.listdir(dest_test_class_dir))}")

    print("\n" + "=" * 60)
    print("SUCCESS: Dataset split completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    split_dataset()
