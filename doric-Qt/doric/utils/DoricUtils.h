#ifndef UTILS_H
#define UTILS_H

#include <QFile>
#include <QResource>
#include <QString>
#include <QTextStream>

class DoricUtils {
public:
  static QString readAssetFile(QString preffix, QString assetName) {
    QResource resource(":" + preffix + "/" + assetName);
    QFile *file = new QFile(resource.fileName());
    file->open(QFile::ReadOnly | QFile::Text);
    QTextStream in(file);
    in.setEncoding(QStringConverter::Encoding::Utf8);
    QString content = in.readAll();
    file->close();
    delete file;

    return content;
  }

  template <typename Base, typename T>
  static inline bool instanceof (const T *) {
    return std::is_base_of<Base, T>::value;
  }
};

#endif // UTILS_H