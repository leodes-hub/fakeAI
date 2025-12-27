const fs = require('fs');
const path = require('path');

// Fix @react-native-voice/voice build.gradle
const voiceBuildGradlePath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-native-voice',
    'voice',
    'android',
    'build.gradle'
);

const voiceFixedContent = `buildscript {
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
    }
}

apply plugin: 'com.android.library'

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

android {
    compileSdk safeExtGet('compileSdkVersion', 36)
    
    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 24)
        targetSdkVersion safeExtGet('targetSdkVersion', 36)
    }
    
    lintOptions {
        abortOnError false
    }
    
    namespace 'com.wenkesj.voice'
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}
`;

// Fix react-native-tts build.gradle
const ttsBuildGradlePath = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-tts',
    'android',
    'build.gradle'
);

const ttsFixedContent = `buildscript {
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
    }
}

apply plugin: 'com.android.library'

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

android {
    compileSdk safeExtGet('compileSdkVersion', 36)
    
    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 24)
        targetSdkVersion safeExtGet('targetSdkVersion', 36)
    }
    
    lintOptions {
        abortOnError false
    }
    
    namespace 'net.no_mad.tts'
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}
`;

// Fix voice package
try {
    if (fs.existsSync(voiceBuildGradlePath)) {
        const buffer = Buffer.from(voiceFixedContent, 'utf8');
        fs.writeFileSync(voiceBuildGradlePath, buffer);
        console.log('✅ Fixed @react-native-voice/voice build.gradle');
    } else {
        console.log('⚠️  Voice package build.gradle not found, skipping fix');
    }
} catch (error) {
    console.error('❌ Error fixing voice package:', error.message);
}

// Fix TTS package
try {
    if (fs.existsSync(ttsBuildGradlePath)) {
        const buffer = Buffer.from(ttsFixedContent, 'utf8');
        fs.writeFileSync(ttsBuildGradlePath, buffer);
        console.log('✅ Fixed react-native-tts build.gradle');
    } else {
        console.log('⚠️  TTS package build.gradle not found, skipping fix');
    }
} catch (error) {
    console.error('❌ Error fixing TTS package:', error.message);
}
